import { useEffect, useState } from "react";
import { PDFDocument } from "pdf-lib";

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function MergePdf() {
  const [files, setFiles] = useState([]);
  const [isMerging, setIsMerging] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [mergedUrl, setMergedUrl] = useState("");

  useEffect(() => {
    return () => {
      if (mergedUrl) URL.revokeObjectURL(mergedUrl);
    };
  }, [mergedUrl]);

  function handleFileChange(event) {
    const selectedFiles = Array.from(event.target.files || []);

    setError("");
    setSuccess("");
    setMergedUrl("");

    const validFiles = selectedFiles.filter(
      (file) =>
        file.type === "application/pdf" ||
        file.name.toLowerCase().endsWith(".pdf"),
    );

    if (validFiles.length !== selectedFiles.length) {
      setError("Only PDF files are allowed. Non-PDF files were skipped.");
    }

    setFiles((previousFiles) => {
      const combined = [...previousFiles, ...validFiles];
      const unique = combined.filter(
        (file, index, array) =>
          array.findIndex(
            (item) =>
              item.name === file.name &&
              item.size === file.size &&
              item.lastModified === file.lastModified,
          ) === index,
      );

      return unique;
    });

    // Allows selecting the same file again later.
    event.target.value = "";
  }

  function removeFile(indexToRemove) {
    setFiles((previousFiles) =>
      previousFiles.filter((_, index) => index !== indexToRemove),
    );

    setError("");
    setSuccess("");
    setMergedUrl("");
  }

  function clearFiles() {
    setFiles([]);
    setError("");
    setSuccess("");
    setMergedUrl("");
  }

  async function handleMerge() {
    if (files.length < 2) {
      setError("Please select at least two PDF files to merge.");
      return;
    }

    setIsMerging(true);
    setError("");
    setSuccess("");
    setMergedUrl("");

    try {
      const mergedPdf = await PDFDocument.create();

      for (const file of files) {
        const arrayBuffer = await file.arrayBuffer();
        const sourcePdf = await PDFDocument.load(arrayBuffer);
        const pageIndices = sourcePdf.getPageIndices();

        const copiedPages = await mergedPdf.copyPages(sourcePdf, pageIndices);

        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      const mergedBytes = await mergedPdf.save();
      const outputBlob = new Blob([mergedBytes], {
        type: "application/pdf",
      });

      const outputUrl = URL.createObjectURL(outputBlob);

      setMergedUrl(outputUrl);
      setSuccess(
        `Successfully merged ${files.length} PDF files. Output size: ${formatBytes(outputBlob.size)}.`,
      );
    } catch (err) {
      console.error("PDF merge error:", err);
      setError(
        "Could not merge these PDFs. Check that the files are valid and not password-protected.",
      );
    } finally {
      setIsMerging(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-4xl">
        {/* Heading */}
        <div className="mb-10 text-center">
          <span className="inline-flex rounded-full bg-rose-100 px-4 py-2 text-sm font-semibold text-rose-700">
            FileFlow PDF Tools
          </span>

          <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Merge PDF Files
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-500">
            Combine multiple PDF documents into one file. Upload your PDFs,
            arrange their order, and download the merged document.
          </p>
        </div>

        {/* Main Card */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          {/* Upload Area */}
          <label
            htmlFor="pdf-upload"
            className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center transition hover:border-rose-400 hover:bg-rose-50/40"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-7 w-7"
              >
                <path d="M12 16V4m-5 5 5-5 5 5" />
                <path d="M4 15v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4" />
              </svg>
            </div>

            <span className="mt-4 text-lg font-bold text-slate-800">
              Select PDF files
            </span>

            <span className="mt-2 text-sm text-slate-500">
              Choose two or more PDF documents
            </span>

            <span className="mt-4 rounded-lg bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white">
              Upload PDFs
            </span>

            <input
              id="pdf-upload"
              type="file"
              accept=".pdf,application/pdf"
              multiple
              onChange={handleFileChange}
              className="sr-only"
            />
          </label>

          {/* Error Message */}
          {error && (
            <p
              role="alert"
              className="mt-4 rounded-lg bg-red-50 p-3 text-sm leading-6 text-red-700"
            >
              {error}
            </p>
          )}

          {/* Success Message */}
          {success && (
            <p
              role="status"
              className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm leading-6 text-emerald-700"
            >
              {success}
            </p>
          )}

          {/* File List */}
          <div className="mt-8">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-slate-900">
                Selected Files ({files.length})
              </h2>

              {files.length > 0 && (
                <button
                  type="button"
                  onClick={clearFiles}
                  className="text-sm font-medium text-rose-600 hover:text-rose-700"
                >
                  Clear all
                </button>
              )}
            </div>

            {files.length === 0 ? (
              <div className="mt-4 rounded-xl border border-slate-200 p-8 text-center">
                <p className="text-sm text-slate-500">No files selected yet.</p>
              </div>
            ) : (
              <ul className="mt-4 space-y-3">
                {files.map((file, index) => (
                  <li
                    key={`${file.name}-${file.size}-${file.lastModified}-${index}`}
                    className="flex items-center gap-3 rounded-xl border border-slate-200 p-4"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-xs font-bold text-rose-600">
                      PDF
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="break-all text-sm font-semibold text-slate-800">
                        {index + 1}. {file.name}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {formatBytes(file.size)}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      aria-label={`Remove ${file.name}`}
                      className="shrink-0 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Merge Button */}
          <button
            type="button"
            onClick={handleMerge}
            disabled={isMerging || files.length < 2}
            className="mt-8 w-full rounded-lg bg-rose-600 px-6 py-3.5 font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isMerging ? "Merging PDFs..." : "Merge PDF Files"}
          </button>

          {/* Download Button */}
          {mergedUrl && (
            <a
              href={mergedUrl}
              download="fileflow-merged.pdf"
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-rose-200 bg-white px-6 py-3.5 font-semibold text-rose-700 transition hover:bg-rose-50"
            >
              Download Merged PDF
              <span aria-hidden="true">↓</span>
            </a>
          )}
        </section>

        <p className="mt-6 text-center text-sm leading-6 text-slate-500">
          Your PDF files are processed in your browser by this tool and are not
          uploaded to a server by this component.
        </p>
      </div>
    </main>
  );
}

export default MergePdf;
