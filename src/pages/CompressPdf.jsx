import { useEffect, useState } from "react";
import { PDFDocument } from "pdf-lib";

function CompressPdf() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  useEffect(() => {
    return () => {
      if (result?.url) URL.revokeObjectURL(result.url);
    };
  }, [result]);

  function formatSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(2)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  function handleFileChange(event) {
    const selectedFile = event.target.files?.[0];

    setError("");
    setFile(null);
    setResult(null);

    if (!selectedFile) return;

    if (
      selectedFile.type !== "application/pdf" &&
      !selectedFile.name.toLowerCase().endsWith(".pdf")
    ) {
      setError("Please select a valid PDF file.");
      event.target.value = "";
      return;
    }

    setFile(selectedFile);
  }

  async function handleCompress() {
    if (!file) {
      setError("Please upload a PDF file first.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const bytes = await file.arrayBuffer();
      const pdf = await PDFDocument.load(bytes);

      const optimizedBytes = await pdf.save({
        useObjectStreams: true,
      });

      const blob = new Blob([optimizedBytes], {
        type: "application/pdf",
      });

      const url = URL.createObjectURL(blob);

      setResult({
        url,
        originalSize: file.size,
        compressedSize: blob.size,
        pageCount: pdf.getPageCount(),
      });
    } catch {
      setError(
        "Could not process this PDF. It may be damaged or password-protected.",
      );
    } finally {
      setLoading(false);
    }
  }

  const savedBytes = result ? result.originalSize - result.compressedSize : 0;

  const savedPercent =
    result && result.originalSize > 0
      ? (savedBytes / result.originalSize) * 100
      : 0;

  return (
    <main className="min-h-[75vh] bg-slate-50 px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 text-center">
          <span className="inline-block rounded-full bg-rose-100 px-4 py-2 text-sm font-semibold text-rose-600">
            FileFlow PDF Tools
          </span>

          <h1 className="mt-5 text-3xl font-bold text-slate-900 sm:text-4xl">
            Compress PDF
          </h1>

          <p className="mx-auto mt-3 max-w-xl leading-7 text-slate-500">
            Try to reduce your PDF file size and compare the result before
            downloading.
          </p>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          <label
            htmlFor="compress-pdf"
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
              id="compress-pdf"
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
                Original size: {formatSize(file.size)}
              </p>
            </div>
          )}

          {error && (
            <p role="alert" className="mt-4 text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={handleCompress}
            disabled={!file || loading}
            className="mt-6 w-full rounded-lg bg-rose-600 px-5 py-3.5 font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-300"
          >
            {loading ? "Processing PDF..." : "Optimize PDF"}
          </button>

          {result && (
            <div className="mt-6 rounded-xl border border-slate-200 p-5">
              <h2 className="text-lg font-semibold text-slate-900">
                Processing Results
              </h2>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Original size</p>
                  <p className="mt-1 text-lg font-bold text-slate-800">
                    {formatSize(result.originalSize)}
                  </p>
                </div>

                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Output size</p>
                  <p className="mt-1 text-lg font-bold text-slate-800">
                    {formatSize(result.compressedSize)}
                  </p>
                </div>
              </div>

              <p className="mt-4 text-sm leading-6 text-slate-600">
                {savedBytes > 0
                  ? `File size reduced by ${savedPercent.toFixed(1)}%.`
                  : savedBytes === 0
                    ? "The output size is unchanged. This PDF could not be made smaller with this basic optimization."
                    : `The output is ${formatSize(Math.abs(savedBytes))} larger. No size reduction was achieved.`}
              </p>

              <a
                href={result.url}
                download="fileflow-optimized.pdf"
                className="mt-5 block w-full rounded-lg bg-rose-600 px-5 py-3 text-center font-semibold text-white transition hover:bg-rose-700"
              >
                Download Processed PDF
              </a>
            </div>
          )}

          <p className="mt-5 text-center text-xs text-slate-400">
            Processing happens in your browser. This basic optimization does not
            guarantee a smaller file.
          </p>
        </section>
      </div>
    </main>
  );
}

export default CompressPdf;
