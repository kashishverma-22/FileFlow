import { useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import * as XLSX from "xlsx";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

function PdfToExcel() {
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

    if (
      selected.type !== "application/pdf" &&
      !selected.name.toLowerCase().endsWith(".pdf")
    ) {
      setError("Please select a valid PDF file.");
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

    let pdf = null;

    try {
      const bytes = await file.arrayBuffer();

      pdf = await pdfjsLib.getDocument({
        data: new Uint8Array(bytes),
      }).promise;

      const workbook = XLSX.utils.book_new();
      const maxPages = 100;

      if (pdf.numPages > maxPages) {
        throw new Error(
          `This version supports up to ${maxPages} pages per conversion.`,
        );
      }

      let extractedItems = 0;

      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
        setProgress(`Extracting page ${pageNumber} of ${pdf.numPages}...`);

        const page = await pdf.getPage(pageNumber);
        const content = await page.getTextContent();

        const items = content.items
          .filter((item) => "str" in item && item.str.trim())
          .map((item) => ({
            text: item.str.trim(),
            x: item.transform[4],
            y: item.transform[5],
          }))
          .sort((a, b) => {
            if (Math.abs(b.y - a.y) > 3) {
              return b.y - a.y;
            }

            return a.x - b.x;
          });

        const lines = [];

        for (const item of items) {
          let line = lines.find(
            (existing) => Math.abs(existing.y - item.y) <= 3,
          );

          if (!line) {
            line = { y: item.y, items: [] };
            lines.push(line);
          }

          line.items.push(item);
        }

        lines.sort((a, b) => b.y - a.y);

        const rows = [[`Page ${pageNumber}`], []];

        for (const line of lines) {
          line.items.sort((a, b) => a.x - b.x);

          const cells = [];
          let previousItem = null;

          for (const item of line.items) {
            if (!previousItem) {
              cells.push(item.text);
            } else {
              const previousEnd = previousItem.x + previousItem.text.length * 4;

              const gap = item.x - previousEnd;

              if (gap > 25) {
                cells.push(item.text);
              } else {
                cells[cells.length - 1] += ` ${item.text}`;
              }
            }

            previousItem = item;
            extractedItems++;
          }

          if (cells.length) rows.push(cells);
        }

        const worksheet = XLSX.utils.aoa_to_sheet(rows);

        worksheet["!cols"] = Array.from(
          { length: Math.max(1, ...rows.map((row) => row.length)) },
          () => ({ wch: 22 }),
        );

        XLSX.utils.book_append_sheet(workbook, worksheet, `Page ${pageNumber}`);
      }

      if (extractedItems === 0) {
        throw new Error(
          "No selectable text was found. This PDF may be scanned; OCR is needed.",
        );
      }

      setProgress("Creating Excel workbook...");

      const outputName = file.name.replace(/\.pdf$/i, "") + ".xlsx";

      XLSX.writeFile(workbook, outputName);

      setSuccess(
        `Excel file downloaded successfully. Processed ${pdf.numPages} pages.`,
      );
      setProgress("");
    } catch (err) {
      console.error(err);

      setError(err.message || "Conversion failed. Please try another PDF.");
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
            PDF to Excel
          </h1>

          <p className="mx-auto mt-3 max-w-xl leading-7 text-slate-500">
            Extract selectable PDF text and export it to an Excel workbook.
          </p>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          <label
            htmlFor="pdf-excel-file"
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
              {file ? "Choose another PDF" : "Upload PDF"}
            </span>

            <span className="mt-2 text-sm text-slate-500">
              Select a PDF from your device
            </span>

            <input
              id="pdf-excel-file"
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
            {loading ? "Converting PDF..." : "Convert to Excel"}
          </button>

          <p className="mt-5 text-center text-xs leading-5 text-slate-400">
            Text extraction runs in your browser. Complex tables, scanned pages
            and original formatting may not be preserved.
          </p>
        </section>
      </div>
    </main>
  );
}

export default PdfToExcel;
