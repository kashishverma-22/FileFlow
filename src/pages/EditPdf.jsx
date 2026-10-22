
import { useEffect, useRef, useState } from "react";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { useNavigate } from "react-router-dom";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const moreTools = [
  {
    title: "Merge PDF",
    description: "Combine multiple PDF files into one.",
    path: "/merge-pdf",
    icon: "📑",
  },
  {
    title: "Split PDF",
    description: "Extract selected pages from a PDF.",
    path: "/split-pdf",
    icon: "✂️",
  },
  {
    title: "Compress PDF",
    description: "Reduce PDF file size where possible.",
    path: "/compress-pdf",
    icon: "🗜️",
  },
  {
    title: "PDF to Word",
    description: "Convert PDF text into a Word document.",
    path: "/pdf-to-word",
    icon: "📝",
  },
  {
    title: "PDF to PowerPoint",
    description: "Convert PDF pages into presentation slides.",
    path: "/pdf-to-powerpoint",
    icon: "📊",
  },
  {
    title: "Image Compressor",
    description: "Compress images in your browser.",
    path: "/image-compressor",
    icon: "🖼️",
  },
];

export default function EditPdf() {
  const navigate = useNavigate();
  const pdfCanvasRef = useRef(null);
  const overlayRef = useRef(null);
  const drawingRef = useRef(null);

  const [file, setFile] = useState(null);
  const [pdfBytes, setPdfBytes] = useState(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageCount, setPageCount] = useState(0);
  const [tool, setTool] = useState("text");
  const [text, setText] = useState("Your text");
  const [fontSize, setFontSize] = useState(22);
  const [color, setColor] = useState("#e11d48");
  const [objects, setObjects] = useState({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const pageObjects = objects[pageNumber] || [];

  useEffect(() => {
    if (!pdfDoc || !pdfCanvasRef.current || !overlayRef.current) return;

    let cancelled = false;
    let renderTask;

    async function renderPage() {
      try {
        const page = await pdfDoc.getPage(pageNumber);
        if (cancelled) return;

        const base = page.getViewport({ scale: 1 });
        const scale = Math.min(
          Math.min(window.innerWidth - 48, 760) / base.width,
          1.5
        );
        const viewport = page.getViewport({ scale });

        const canvas = pdfCanvasRef.current;
        const overlay = overlayRef.current;

        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;

        overlay.width = canvas.width;
        overlay.height = canvas.height;
        overlay.style.width = canvas.style.width;
        overlay.style.height = canvas.style.height;

        renderTask = page.render({
          canvasContext: canvas.getContext("2d"),
          viewport,
        });

        await renderTask.promise;
        if (cancelled) return;

        drawObjects(objects[pageNumber] || []);
      } catch (err) {
        if (!cancelled) {
          console.error(err);
          setError("Unable to display this PDF page.");
        }
      }
    }

    function drawObjects(items) {
      const canvas = overlayRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      items.forEach((item) => {
        if (item.type === "text") {
          ctx.font = `${item.fontSize}px Arial`;
          ctx.fillStyle = item.color;
          ctx.fillText(item.text, item.x, item.y);
        }

        if (item.type === "stroke" || item.type === "highlight") {
          ctx.beginPath();
          ctx.strokeStyle = item.color;
          ctx.lineWidth = item.width;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.globalAlpha = item.type === "highlight" ? 0.3 : 1;

          item.points.forEach((point, index) => {
            if (index === 0) ctx.moveTo(point.x, point.y);
            else ctx.lineTo(point.x, point.y);
          });

          ctx.stroke();
          ctx.globalAlpha = 1;
        }

        if (item.type === "image") {
          const img = new Image();
          img.onload = () => {
            if (cancelled) return;
            ctx.drawImage(img, item.x, item.y, item.width, item.height);
          };
          img.src = item.src;
        }
      });
    }

    renderPage();

    return () => {
      cancelled = true;
      renderTask?.cancel();
    };
  }, [pdfDoc, pageNumber, objects]);

  async function handleFile(event) {
    const selected = event.target.files?.[0];
    if (!selected) return;

    setError("");
    setMessage("");

    if (!selected.name.toLowerCase().endsWith(".pdf")) {
      setError("Please select a PDF file.");
      event.target.value = "";
      return;
    }

    try {
      const bytes = await selected.arrayBuffer();
      const loaded = await pdfjsLib.getDocument({
        data: new Uint8Array(bytes),
      }).promise;

      setFile(selected);
      setPdfBytes(bytes);
      setPdfDoc(loaded);
      setPageCount(loaded.numPages);
      setPageNumber(1);
      setObjects({});
      setMessage("PDF loaded successfully.");
    } catch (err) {
      console.error(err);
      setError("Could not open this PDF. It may be damaged or password-protected.");
    }
  }

  function updateObjects(next) {
    setObjects((previous) => ({
      ...previous,
      [pageNumber]: next,
    }));
  }

  function getPosition(event) {
    const rect = overlayRef.current.getBoundingClientRect();

    return {
      x: (event.clientX - rect.left) *
        (overlayRef.current.width / rect.width),
      y: (event.clientY - rect.top) *
        (overlayRef.current.height / rect.height),
    };
  }

  function handlePointerDown(event) {
    if (!pdfDoc) return;

    const point = getPosition(event);

    if (tool === "text") {
      if (!text.trim()) {
        setError("Please enter text first.");
        return;
      }

      updateObjects([
        ...pageObjects,
        {
          id: crypto.randomUUID(),
          type: "text",
          text: text.trim(),
          x: point.x,
          y: point.y,
          fontSize,
          color,
        },
      ]);

      setError("");
      setMessage("Text added.");
      return;
    }

    if (tool === "delete") {
      const ctx = overlayRef.current.getContext("2d");

      const found = [...pageObjects].reverse().find((item) => {
        if (item.type === "text") {
          ctx.font = `${item.fontSize}px Arial`;
          const width = ctx.measureText(item.text).width;

          return (
            point.x >= item.x - 8 &&
            point.x <= item.x + width + 8 &&
            point.y >= item.y - item.fontSize &&
            point.y <= item.y + 8
          );
        }

        if (item.type === "image") {
          return (
            point.x >= item.x &&
            point.x <= item.x + item.width &&
            point.y >= item.y &&
            point.y <= item.y + item.height
          );
        }

        return item.points.some(
          (p) => Math.hypot(p.x - point.x, p.y - point.y) < 16
        );
      });

      if (found) {
        updateObjects(pageObjects.filter((item) => item.id !== found.id));
        setMessage("Added object deleted.");
      } else {
        setMessage("Click on an object you added to delete it.");
      }

      return;
    }

    overlayRef.current.setPointerCapture(event.pointerId);

    drawingRef.current = {
      id: crypto.randomUUID(),
      type: tool === "highlight" ? "highlight" : "stroke",
      color: tool === "highlight" ? "#facc15" : color,
      width: tool === "highlight" ? 22 : 3,
      points: [point],
    };
  }

  function handlePointerMove(event) {
    if (!drawingRef.current) return;

    drawingRef.current.points.push(getPosition(event));

    // Preview the current drawing on top of the saved objects.
    const ctx = overlayRef.current.getContext("2d");
    const canvas = overlayRef.current;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const items = [...pageObjects, drawingRef.current];

    items.forEach((item) => {
      if (item.type === "text") {
        ctx.font = `${item.fontSize}px Arial`;
        ctx.fillStyle = item.color;
        ctx.fillText(item.text, item.x, item.y);
      } else if (item.type === "image") {
        const img = new Image();
        img.onload = () =>
          ctx.drawImage(img, item.x, item.y, item.width, item.height);
        img.src = item.src;
      } else {
        ctx.beginPath();
        ctx.strokeStyle = item.color;
        ctx.lineWidth = item.width;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.globalAlpha = item.type === "highlight" ? 0.3 : 1;
        item.points.forEach((p, i) => {
          if (i === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    });
  }

  function handlePointerUp() {
    if (!drawingRef.current) return;

    updateObjects([...pageObjects, drawingRef.current]);
    drawingRef.current = null;
  }

  function handleImage(event) {
    const imageFile = event.target.files?.[0];
    if (!imageFile) return;

    if (!imageFile.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const img = new Image();

      img.onload = () => {
        const width = Math.min(220, img.width);
        const height = width * (img.height / img.width);

        updateObjects([
          ...pageObjects,
          {
            id: crypto.randomUUID(),
            type: "image",
            src: reader.result,
            x: 40,
            y: 40,
            width,
            height,
          },
        ]);

        setTool("delete");
        setError("");
        setMessage("Image/signature added.");
      };

      img.onerror = () => setError("Unable to load this image.");
      img.src = reader.result;
    };

    reader.readAsDataURL(imageFile);
    event.target.value = "";
  }

  function hexToRgb(hex) {
    const value = hex.replace("#", "");
    return {
      r: parseInt(value.slice(0, 2), 16) / 255,
      g: parseInt(value.slice(2, 4), 16) / 255,
      b: parseInt(value.slice(4, 6), 16) / 255,
    };
  }

  async function exportPdf() {
    if (!pdfBytes || !pdfDoc) return;

    setBusy(true);
    setError("");
    setMessage("");

    try {
      const output = await PDFDocument.load(pdfBytes);
      const font = await output.embedFont(StandardFonts.Helvetica);
      const pages = output.getPages();

      for (const [pageKey, items] of Object.entries(objects)) {
        const page = pages[Number(pageKey) - 1];
        if (!page || !items.length) continue;

        const pdfPage = await pdfDoc.getPage(Number(pageKey));
        const viewport = pdfPage.getViewport({ scale: 1 });
        const { width, height } = page.getSize();

        const scaleX = width / viewport.width;
        const scaleY = height / viewport.height;

        for (const item of items) {
          if (item.type === "text") {
            const c = hexToRgb(item.color);
            page.drawText(item.text, {
              x: item.x * scaleX,
              y: height - item.y * scaleY,
              size: item.fontSize * scaleY,
              font,
              color: rgb(c.r, c.g, c.b),
            });
          } else if (item.type === "image") {
            const response = await fetch(item.src);
            const blob = await response.blob();
            const data = await blob.arrayBuffer();
            const isPng = blob.type === "image/png";
            const embedded = isPng
              ? await output.embedPng(data)
              : await output.embedJpg(data);

            page.drawImage(embedded, {
              x: item.x * scaleX,
              y: height - (item.y + item.height) * scaleY,
              width: item.width * scaleX,
              height: item.height * scaleY,
            });
          } else {
            // Draw the pen/highlight strokes as short line segments.
            const c = hexToRgb(item.color);

            for (let i = 1; i < item.points.length; i++) {
              const p1 = item.points[i - 1];
              const p2 = item.points[i];

              page.drawLine({
                start: {
                  x: p1.x * scaleX,
                  y: height - p1.y * scaleY,
                },
                end: {
                  x: p2.x * scaleX,
                  y: height - p2.y * scaleY,
                },
                thickness: item.width * scaleY,
                color: rgb(c.r, c.g, c.b),
                opacity: item.type === "highlight" ? 0.3 : 1,
              });
            }
          }
        }
      }

      const saved = await output.save();
      const url = URL.createObjectURL(
        new Blob([saved], { type: "application/pdf" })
      );

      const link = document.createElement("a");
      link.href = url;
      link.download = `${file.name.replace(/\.pdf$/i, "")}-edited.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();

      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMessage("Edited PDF downloaded.");
    } catch (err) {
      console.error(err);
      setError(
        "Export failed. Try a PDF and image format supported by the browser."
      );
    } finally {
      setBusy(false);
    }
  }

  const editorTools = [
    ["text", "Add Text"],
    ["stroke", "Pen / Draw"],
    ["highlight", "Highlight"],
    ["delete", "Delete Object"],
  ];

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:py-14">
      <div className="mx-auto max-w-6xl">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-5 text-sm font-medium text-slate-600 hover:text-rose-600"
        >
          ← Back
        </button>

        <header className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-100 text-3xl">
            ✏️
          </div>
          <h1 className="text-3xl font-bold text-slate-800 sm:text-4xl">
            Edit PDF
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-slate-500">
            Add text, draw, highlight, and place a signature or image on your PDF.
          </p>
        </header>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-rose-200 bg-rose-50/50 px-5 py-8 text-center hover:bg-rose-50">
            <span className="mb-2 text-3xl">📁</span>
            <span className="font-semibold text-slate-800">
              {file ? file.name : "Choose a PDF file"}
            </span>
            <span className="mt-1 text-sm text-slate-500">
              PDF documents only
            </span>
            <input
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFile}
              className="sr-only"
            />
          </label>

          {pdfDoc && (
            <>
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={pageNumber <= 1}
                    onClick={() => setPageNumber((p) => p - 1)}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:opacity-40"
                  >
                    ← Previous
                  </button>
                  <span className="text-sm text-slate-600">
                    Page {pageNumber} of {pageCount}
                  </span>
                  <button
                    type="button"
                    disabled={pageNumber >= pageCount}
                    onClick={() => setPageNumber((p) => p + 1)}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:opacity-40"
                  >
                    Next →
                  </button>
                </div>

                <button
                  type="button"
                  onClick={exportPdf}
                  disabled={busy}
                  className="rounded-xl bg-rose-600 px-5 py-3 font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
                >
                  {busy ? "Preparing PDF..." : "Download edited PDF"}
                </button>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {editorTools.map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setTool(id)}
                    className={`rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                      tool === id
                        ? "bg-rose-600 text-white"
                        : "border border-slate-200 bg-white text-slate-700 hover:border-rose-300"
                    }`}
                  >
                    {label}
                  </button>
                ))}

                <label className="cursor-pointer rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:border-rose-300">
                  Add Image / Signature
                  <input
                    type="file"
                    accept="image/png,image/jpeg"
                    onChange={handleImage}
                    className="sr-only"
                  />
                </label>
              </div>

              {tool === "text" && (
                <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl bg-slate-50 p-4">
                  <input
                    value={text}
                    onChange={(event) => setText(event.target.value)}
                    placeholder="Enter text to add"
                    className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-rose-400"
                  />
                  <label className="flex items-center gap-2 text-sm text-slate-600">
                    Size
                    <input
                      type="number"
                      min="8"
                      max="100"
                      value={fontSize}
                      onChange={(event) =>
                        setFontSize(
                          Math.min(100, Math.max(8, Number(event.target.value) || 8))
                        )
                      }
                      className="w-20 rounded-lg border border-slate-200 px-2 py-2"
                    />
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-600">
                    Color
                    <input
                      type="color"
                      value={color}
                      onChange={(event) => setColor(event.target.value)}
                      className="h-9 w-10 cursor-pointer"
                    />
                  </label>
                </div>
              )}

              <p className="mt-4 text-sm text-slate-500">
                {tool === "text" && "Click on the page to place your text."}
                {tool === "stroke" && "Click and drag on the page to draw."}
                {tool === "highlight" && "Drag across the page to highlight an area."}
                {tool === "delete" && "Click an object you added to remove it."}
              </p>

              <div className="mt-6 overflow-auto rounded-2xl border border-slate-200 bg-slate-100 p-3 sm:p-5">
                <div className="relative mx-auto w-fit bg-white shadow-md">
                  <canvas ref={pdfCanvasRef} className="block max-w-full" />
                  <canvas
                    ref={overlayRef}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                    className="absolute left-0 top-0 touch-none"
                  />
                </div>
              </div>
            </>
          )}

          {error && (
            <p role="alert" className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}

          {message && (
            <p role="status" className="mt-5 rounded-xl bg-green-50 p-3 text-sm text-green-700">
              {message}
            </p>
          )}

          <p className="mt-5 text-center text-xs leading-5 text-slate-400">
            The original PDF is preserved underneath your edits. This editor
            cannot erase arbitrary existing text or objects.
          </p>
        </section>

        {/* More PDF Tools */}
        <section className="mt-12">
          <h2 className="text-2xl font-bold text-slate-800">
            Explore More PDF Tools
          </h2>
          <p className="mt-2 text-slate-500">
            Choose another tool to continue working with your documents.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {moreTools.map((item) => (
              <button
                key={item.title}
                type="button"
                onClick={() => navigate(item.path)}
                className="rounded-2xl border border-slate-200 bg-white p-5 text-left transition hover:-translate-y-1 hover:border-rose-300 hover:shadow-md"
              >
                <span className="text-3xl">{item.icon}</span>
                <h3 className="mt-4 font-semibold text-slate-800">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {item.description}
                </p>
                <span className="mt-4 inline-block text-sm font-semibold text-rose-600">
                  Open tool →
                </span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
