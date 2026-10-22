import { useState } from "react";
import { renderAsync } from "docx-preview";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

function WordToPdf() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function handleFileChange(event) {
    const selected = event.target.files?.[0];

    setFile(null);
    setError("");
    setSuccess("");
    setProgress("");

    if (!selected) return;

    if (!selected.name.toLowerCase().endsWith(".docx")) {
      setError("Please select a .docx Word document.");
      event.target.value = "";
      return;
    }

    setFile(selected);
  }

  async function handleConvert() {
    if (!file) {
      setError("Please upload a Word document first.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    let container;

    try {
      setProgress("Reading Word document...");

      const buffer = await file.arrayBuffer();

      container = document.createElement("div");

      Object.assign(container.style, {
        position: "fixed",
        left: "-10000px",
        top: "0",
        width: "794px",
        background: "#ffffff",
        color: "#000000",
        zIndex: "-1",
      });

      document.body.appendChild(container);

      await renderAsync(buffer, container, null, {
        className: "word-to-pdf-preview",
        inWrapper: false,
        breakPages: true,
        ignoreLastRenderedPageBreak: false,
        useBase64URL: true,
      });

      const pages = Array.from(container.querySelectorAll("section.docx"));

      const elements = pages.length
        ? pages
        : Array.from(container.children).filter(
            (element) => element.scrollHeight > 0,
          );

      if (!elements.length) {
        throw new Error("No document pages could be rendered.");
      }

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
      });

      for (let i = 0; i < elements.length; i++) {
        setProgress(`Converting page ${i + 1} of ${elements.length}...`);

        const element = elements[i];

        const canvas = await html2canvas(element, {
          scale: 1.5,
          backgroundColor: "#ffffff",
          useCORS: true,
          logging: false,
        });

        const image = canvas.toDataURL("image/jpeg", 0.85);

        const pageWidth = 210;
        const pageHeight = 297;
        const margin = 8;

        const maxWidth = pageWidth - margin * 2;
        const maxHeight = pageHeight - margin * 2;

        const scale = Math.min(
          maxWidth / canvas.width,
          maxHeight / canvas.height,
        );

        const imageWidth = canvas.width * scale;
        const imageHeight = canvas.height * scale;

        if (i > 0) pdf.addPage();

        pdf.addImage(
          image,
          "JPEG",
          (pageWidth - imageWidth) / 2,
          margin,
          imageWidth,
          imageHeight,
          undefined,
          "FAST",
        );

        canvas.width = 0;
        canvas.height = 0;
      }

      setProgress("Preparing PDF download...");

      const outputName = file.name.replace(/\.docx$/i, "") + ".pdf";

      pdf.save(outputName);

      setSuccess(
        `PDF downloaded successfully. Converted ${elements.length} rendered page(s).`,
      );

      setProgress("");
    } catch (err) {
      console.error(err);

      setError(
        err.message || "Conversion failed. Please try another Word document.",
      );

      setProgress("");
    } finally {
      if (container) container.remove();

      setLoading(false);
    }
  }

  return (
    <main className="min-h-[75vh] bg-slate-50 px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 text-center">
          <span className="inline-block rounded-full bg-rose-100 px-4 py-2 text-sm font-semibold text-rose-600">
            FileFlow Document Tools
          </span>

          <h1 className="mt-5 text-3xl font-bold text-slate-900 sm:text-4xl">
            Word to PDF
          </h1>

          <p className="mx-auto mt-3 max-w-xl leading-7 text-slate-500">
            Convert Word documents into downloadable PDF files.
          </p>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          <label
            htmlFor="word-pdf-file"
            className="flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center transition hover:border-rose-400"
          >
            <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-7 w-7"
              >
                <path d="M12 16V4m-4 4 4-4 4 4" />
                <path d="M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" />
              </svg>
            </span>

            <span className="font-semibold text-slate-800">
              {file ? "Choose another Word file" : "Upload Word document"}
            </span>

            <span className="mt-2 text-sm text-slate-500">
              Supported format: .docx
            </span>

            <input
              id="word-pdf-file"
              type="file"
              accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={handleFileChange}
              className="sr-only"
            />
          </label>

          {file && (
            <div className="mt-5 rounded-xl border border-slate-200 p-4">
              <p className="break-all font-semibold text-slate-800">
                {file.name}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
          )}

          {error && (
            <p
              role="alert"
              className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600"
            >
              {error}
            </p>
          )}

          {progress && (
            <p role="status" className="mt-4 text-sm text-slate-600">
              {progress}
            </p>
          )}

          {success && (
            <p
              role="status"
              className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-700"
            >
              {success}
            </p>
          )}

          <button
            type="button"
            onClick={handleConvert}
            disabled={!file || loading}
            className="mt-6 w-full rounded-lg bg-rose-600 px-5 py-3.5 font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-300"
          >
            {loading ? "Converting..." : "Convert to PDF"}
          </button>

          <p className="mt-5 text-center text-xs leading-5 text-slate-400">
            Best suited to DOCX files. Complex formatting, page breaks, fonts
            and images may differ. Output pages are image-based, so text may not
            be selectable.
          </p>
        </section>
      </div>
    </main>
  );
}

export default WordToPdf;
