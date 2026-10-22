import { useState } from "react";
import { pptxToPdf } from "@s8fy/pptx-converter";

export default function PowerPointToPdf() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function handleFileChange(event) {
    const selectedFile = event.target.files?.[0];

    setError("");
    setSuccess("");

    if (!selectedFile) return;

    if (!selectedFile.name.toLowerCase().endsWith(".pptx")) {
      setFile(null);
      setError("Please select a PowerPoint (.pptx) file.");
      event.target.value = "";
      return;
    }

    setFile(selectedFile);
  }

  async function handleConvert() {
    if (!file) {
      setError("Please upload a PowerPoint file first.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    let pdfUrl;

    try {
      const result = await pptxToPdf(file);

      if (!result?.data) {
        throw new Error("The converter did not return a PDF file.");
      }

      const pdfBlob = new Blob([result.data], {
        type: "application/pdf",
      });

      pdfUrl = URL.createObjectURL(pdfBlob);

      const link = document.createElement("a");
      link.href = pdfUrl;
      link.download = `${file.name.replace(/\.pptx$/i, "")}.pdf`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      setSuccess("Your PDF has been generated and downloaded.");
    } catch (err) {
      console.error("PowerPoint to PDF error:", err);
      setError(
        err?.message || "Conversion failed. Please try another PPTX file.",
      );
    } finally {
      if (pdfUrl) {
        setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000);
      }

      setLoading(false);
    }
  }

  return (
    <main className="min-h-[75vh] bg-slate-50 px-4 py-12 sm:py-16">
      <div className="mx-auto max-w-3xl">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="mb-6 text-sm font-medium text-slate-600 hover:text-rose-600"
        >
          ← Back
        </button>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-3xl">
            📊
          </div>

          <h1 className="text-center text-3xl font-bold text-slate-800 sm:text-4xl">
            PowerPoint to PDF
          </h1>

          <p className="mx-auto mt-3 max-w-xl text-center text-slate-500">
            Convert your PowerPoint presentation into a downloadable PDF. Your
            presentation is processed in your browser.
          </p>

          <label className="mt-8 flex min-h-52 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-rose-200 bg-rose-50/50 px-5 py-8 text-center transition hover:border-rose-400 hover:bg-rose-50">
            <span className="mb-3 text-4xl">📁</span>

            <span className="font-semibold text-slate-800">
              Choose a PowerPoint file
            </span>

            <span className="mt-2 text-sm text-slate-500">
              Supported format: .pptx
            </span>

            <input
              type="file"
              accept=".pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation"
              onChange={handleFileChange}
              className="sr-only"
            />
          </label>

          {file && (
            <div className="mt-5 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <span className="text-2xl">📄</span>

              <div className="min-w-0 flex-1">
                <p className="break-words text-sm font-semibold text-slate-800">
                  {file.name}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setError("");
                  setSuccess("");
                }}
                disabled={loading}
                className="text-sm font-medium text-rose-600 hover:text-rose-700 disabled:opacity-50"
              >
                Remove
              </button>
            </div>
          )}

          {error && (
            <p
              role="alert"
              className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </p>
          )}

          {success && (
            <p
              role="status"
              className="mt-5 rounded-xl bg-green-50 p-3 text-sm text-green-700"
            >
              {success}
            </p>
          )}

          <button
            type="button"
            onClick={handleConvert}
            disabled={!file || loading}
            className="mt-6 w-full rounded-xl bg-rose-600 px-6 py-4 font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Converting..." : "Convert to PDF"}
          </button>

          <p className="mt-4 text-center text-xs leading-5 text-slate-400">
            Only .pptx files are supported. Complex animations, fonts, charts,
            or other slide features may not convert exactly as in PowerPoint.
            Demo output may contain a watermark.
          </p>
        </section>
      </div>
    </main>
  );
}
