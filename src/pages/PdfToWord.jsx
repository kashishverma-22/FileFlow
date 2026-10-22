import { useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

function PdfToWord() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [progress, setProgress] = useState("");

  function handleFileChange(event) {
    const selected = event.target.files?.[0];

    setError("");
    setSuccess("");
    setProgress("");
    setFile(null);

    if (!selected) return;

    if (
      selected.type !== "application/pdf" &&
      !selected.name.toLowerCase().endsWith(".pdf")
    ) {
      setError("Please select a PDF file.");
      event.target.value = "";
      return;
    }

    setFile(selected);
  }

  async function handleConvert() {
    if (!file) {
      setError("Please upload a PDF file first.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");
    setProgress("Reading PDF...");

    let pdf = null;

    try {
      const bytes = await file.arrayBuffer();

      pdf = await pdfjsLib.getDocument({
        data: new Uint8Array(bytes),
      }).promise;

      const paragraphs = [];

      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
        setProgress(
          `Extracting text from page ${pageNumber} of ${pdf.numPages}...`,
        );

        const page = await pdf.getPage(pageNumber);
        const content = await page.getTextContent();

        let lines = [];
        let currentLine = [];
        let previousY = null;

        for (const item of content.items) {
          if (!("str" in item)) continue;

          const text = item.str.trim();
          if (!text) continue;

          const y = item.transform?.[5] ?? null;

          if (previousY !== null && y !== null && Math.abs(y - previousY) > 3) {
            if (currentLine.length) {
              lines.push(currentLine.join(" "));
              currentLine = [];
            }
          }

          currentLine.push(text);

          if (y !== null) previousY = y;

          if (item.hasEOL) {
            lines.push(currentLine.join(" "));
            currentLine = [];
            previousY = null;
          }
        }

        if (currentLine.length) {
          lines.push(currentLine.join(" "));
        }

        const pageText = lines.join("\n").trim();

        paragraphs.push(
          new Paragraph({
            text: `Page ${pageNumber}`,
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 240, after: 120 },
          }),
        );

        if (pageText) {
          pageText.split(/\n+/).forEach((line) => {
            const cleanLine = line.trim();

            if (cleanLine) {
              paragraphs.push(
                new Paragraph({
                  children: [new TextRun(cleanLine)],
                  spacing: { after: 100 },
                }),
              );
            }
          });
        } else {
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun("[No extractable text found on this page.]"),
              ],
            }),
          );
        }
      }

      setProgress("Creating Word document...");

      const doc = new Document({
        sections: [
          {
            children: paragraphs,
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `${file.name.replace(/\.pdf$/i, "")}.docx`;
      document.body.appendChild(link);
      link.click();
      link.remove();

      setTimeout(() => URL.revokeObjectURL(url), 1000);

      setSuccess(
        `Word document downloaded successfully. Processed ${pdf.numPages} pages.`,
      );
      setProgress("");
    } catch (err) {
      console.error(err);
      setError(
        "Conversion failed. The PDF may be damaged, password-protected, or unsupported.",
      );
      setProgress("");
    } finally {
      if (pdf) {
        await pdf.destroy();
      }

      setLoading(false);
    }
  }

  return (
    <main className="min-h-[75vh] bg-slate-50 px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 text-center">
          <span className="inline-block rounded-full bg-rose-100 px-4 py-2 text-sm font-semibold text-rose-600">
            FileFlow PDF Tools
          </span>

          <h1 className="mt-5 text-3xl font-bold text-slate-900 sm:text-4xl">
            PDF to Word
          </h1>

          <p className="mx-auto mt-3 max-w-xl leading-7 text-slate-500">
            Extract text from a PDF and create an editable Word document.
          </p>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          <label
            htmlFor="pdf-word-file"
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
              {file ? "Choose another PDF" : "Select PDF file"}
            </span>

            <span className="mt-2 text-sm text-slate-500">
              Upload a PDF document from your device
            </span>

            <input
              id="pdf-word-file"
              type="file"
              accept=".pdf,application/pdf"
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
            {loading ? "Converting..." : "Convert to Word"}
          </button>

          <p className="mt-5 text-center text-xs leading-5 text-slate-400">
            Text extraction runs in your browser. Original PDF formatting,
            tables, images and scanned text may not be preserved.
          </p>
        </section>
      </div>
    </main>
  );
}

export default PdfToWord;
