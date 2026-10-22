import { useEffect, useState } from "react";
import { PDFDocument } from "pdf-lib";

function SplitPdf() {
  const [file, setFile] = useState(null);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedPages, setSelectedPages] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [outputUrl, setOutputUrl] = useState("");

  useEffect(() => {
    return () => {
      if (outputUrl) URL.revokeObjectURL(outputUrl);
    };
  }, [outputUrl]);

  async function handleFileChange(event) {
    const selectedFile = event.target.files?.[0];

    setError("");
    setFile(null);
    setTotalPages(0);
    setSelectedPages("");

    if (outputUrl) URL.revokeObjectURL(outputUrl);
    setOutputUrl("");

    if (!selectedFile) return;

    if (selectedFile.type !== "application/pdf") {
      setError("Please select a valid PDF file.");
      event.target.value = "";
      return;
    }

    try {
      const bytes = await selectedFile.arrayBuffer();
      const pdf = await PDFDocument.load(bytes);

      setFile(selectedFile);
      setTotalPages(pdf.getPageCount());
      setSelectedPages(`1-${pdf.getPageCount()}`);
    } catch {
      setError(
        "Unable to read this PDF. It may be password-protected or damaged.",
      );
      event.target.value = "";
    }
  }

  async function handleSplit() {
    if (!file || !selectedPages.trim()) {
      setError("Please upload a PDF and enter the pages to extract.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const pageNumbers = [];

      for (const part of selectedPages.split(",")) {
        const range = part.trim();

        if (!range) throw new Error("Enter valid page numbers.");

        const match = range.match(/^(\d+)(?:\s*-\s*(\d+))?$/);

        if (!match) {
          throw new Error("Use a format like 1-3 or 1,3,5.");
        }

        const start = Number(match[1]);
        const end = Number(match[2] || match[1]);

        if (start < 1 || end < start || end > totalPages) {
          throw new Error(`Pages must be between 1 and ${totalPages}.`);
        }

        for (let page = start; page <= end; page++) {
          pageNumbers.push(page - 1);
        }
      }

      const uniquePages = [...new Set(pageNumbers)];

      const sourceBytes = await file.arrayBuffer();
      const sourcePdf = await PDFDocument.load(sourceBytes);
      const newPdf = await PDFDocument.create();

      const copiedPages = await newPdf.copyPages(sourcePdf, uniquePages);

      copiedPages.forEach((page) => newPdf.addPage(page));

      const pdfBytes = await newPdf.save();
      const blob = new Blob([pdfBytes], {
        type: "application/pdf",
      });

      if (outputUrl) URL.revokeObjectURL(outputUrl);

      setOutputUrl(URL.createObjectURL(blob));
    } catch (err) {
      setError(err.message || "Something went wrong while splitting.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-[75vh] bg-slate-50 px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 text-center">
          <span className="inline-block rounded-full bg-rose-100 px-4 py-2 text-sm font-semibold text-rose-600">
            FileFlow PDF Tools
          </span>

          <h1 className="mt-5 text-3xl font-bold text-slate-900 sm:text-4xl">
            Split PDF Files
          </h1>

          <p className="mx-auto mt-3 max-w-xl leading-7 text-slate-500">
            Extract the pages you need from your PDF and download them as a
            separate document.
          </p>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          <label
            htmlFor="split-pdf"
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
              {file ? "Choose another PDF" : "Select a PDF file"}
            </span>

            <span className="mt-2 text-sm text-slate-500">
              PDF documents only
            </span>

            <input
              id="split-pdf"
              type="file"
              accept="application/pdf,.pdf"
              onChange={handleFileChange}
              className="sr-only"
            />
          </label>

          {file && (
            <div className="mt-6 rounded-xl border border-slate-200 p-4">
              <p className="break-all font-semibold text-slate-800">
                {file.name}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                {totalPages} pages · {(file.size / 1024).toFixed(1)} KB
              </p>

              <label
                htmlFor="page-range"
                className="mt-5 block text-sm font-semibold text-slate-800"
              >
                Pages to extract
              </label>

              <input
                id="page-range"
                type="text"
                value={selectedPages}
                onChange={(event) => {
                  setSelectedPages(event.target.value);
                  setOutputUrl("");
                  setError("");
                }}
                placeholder="Example: 1-3, 5"
                className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
              />

              <p className="mt-2 text-sm text-slate-500">
                Example: 1-3 extracts pages 1, 2 and 3. Use 1,3,5 to extract
                individual pages.
              </p>
            </div>
          )}

          {error && (
            <p
              role="alert"
              className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-600"
            >
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={handleSplit}
            disabled={!file || loading}
            className="mt-6 w-full rounded-lg bg-rose-600 px-5 py-3.5 font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-300"
          >
            {loading ? "Splitting PDF..." : "Split PDF"}
          </button>

          {outputUrl && (
            <a
              href={outputUrl}
              download="fileflow-split.pdf"
              className="mt-4 block w-full rounded-lg border border-rose-200 bg-rose-50 px-5 py-3.5 text-center font-semibold text-rose-700 hover:bg-rose-100"
            >
              Download Split PDF
            </a>
          )}

          <p className="mt-5 text-center text-xs text-slate-400">
            Your PDF is processed locally in your browser.
          </p>
        </section>
      </div>
    </main>
  );
}

export default SplitPdf;
