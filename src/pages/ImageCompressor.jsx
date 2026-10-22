
import { useEffect, useState } from "react";

const SUPPORTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

const OUTPUT_FORMATS = {
  "image/jpeg": "JPEG",
  "image/png": "PNG",
  "image/webp": "WebP",
};

function formatBytes(bytes) {
  if (bytes === undefined || bytes === null) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function ImageCompressor() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [compressedUrl, setCompressedUrl] = useState("");
  const [compressedBlob, setCompressedBlob] = useState(null);
  const [quality, setQuality] = useState(0.7);
  const [outputFormat, setOutputFormat] = useState("image/webp");
  const [isCompressing, setIsCompressing] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    return () => {
      if (compressedUrl) URL.revokeObjectURL(compressedUrl);
    };
  }, [compressedUrl]);

  function handleFileChange(event) {
    const selectedFile = event.target.files?.[0];

    setError("");
    setMessage("");
    setCompressedBlob(null);
    setCompressedUrl("");

    if (!selectedFile) return;

    if (!SUPPORTED_TYPES.includes(selectedFile.type)) {
      setError("Please upload a JPG, JPEG, PNG, or WebP image.");
      event.target.value = "";
      return;
    }

    if (selectedFile.size === 0) {
      setError("This file is empty. Please select another image.");
      event.target.value = "";
      return;
    }

    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));

    // Keep PNG as PNG by default; lossy formats can use WebP.
    setOutputFormat(
      selectedFile.type === "image/png"
        ? "image/png"
        : "image/webp"
    );
  }

  async function handleCompress() {
    if (!file || !previewUrl) {
      setError("Please select an image first.");
      return;
    }

    setIsCompressing(true);
    setError("");
    setMessage("");
    setCompressedBlob(null);
    setCompressedUrl("");

    try {
      const image = new Image();

      image.src = previewUrl;

      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = () => reject(
          new Error("Could not load this image. Please try another file.")
        );
      });

      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;

      const context = canvas.getContext("2d");

      if (!context) {
        throw new Error("Your browser could not process this image.");
      }

      // JPEG does not support transparency, so use a white background.
      if (outputFormat === "image/jpeg") {
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
      }

      context.drawImage(image, 0, 0);

      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob(
          (result) => {
            if (result) resolve(result);
            else reject(new Error("Image conversion failed."));
          },
          outputFormat,
          outputFormat === "image/png" ? undefined : quality
        );
      });

      if (blob.type !== outputFormat) {
        throw new Error("This image format is not supported by your browser.");
      }

      setCompressedBlob(blob);
      setCompressedUrl(URL.createObjectURL(blob));

      if (blob.size < file.size) {
        const saved = ((file.size - blob.size) / file.size) * 100;
        setMessage(`Image processed successfully. File size reduced by ${saved.toFixed(1)}%.`);
      } else if (blob.size === file.size) {
        setMessage("Image processed. The file size stayed the same.");
      } else {
        setMessage("Image processed, but the output is larger. Try a lower quality or another format.");
      }
    } catch (err) {
      setError(err.message || "Something went wrong while processing the image.");
    } finally {
      setIsCompressing(false);
    }
  }

  function handleReset() {
    setFile(null);
    setPreviewUrl("");
    setCompressedUrl("");
    setCompressedBlob(null);
    setQuality(0.7);
    setOutputFormat("image/webp");
    setError("");
    setMessage("");

    const input = document.getElementById("image-upload");
    if (input) input.value = "";
  }

  const savings = file && compressedBlob
    ? ((file.size - compressedBlob.size) / file.size) * 100
    : null;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 text-center">
          <span className="inline-block rounded-full bg-rose-100 px-4 py-2 text-sm font-semibold text-rose-700">
            FileFlow Image Tools
          </span>

          <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Image Compressor
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-500">
            Reduce image file size with a quality setting that works for
            your image. Upload JPG, PNG, or WebP files and download the result.
          </p>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          <label
            htmlFor="image-upload"
            className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center transition hover:border-rose-400 hover:bg-rose-50/40"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
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
            </span>

            <span className="mt-4 text-lg font-bold text-slate-800">
              Click to upload an image
            </span>
            <span className="mt-2 text-sm text-slate-500">
              JPG, JPEG, PNG or WebP
            </span>

            <span className="mt-4 rounded-lg bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white">
              Choose Image
            </span>

            <input
              id="image-upload"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="sr-only"
            />
          </label>

          {error && (
            <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}

          {file && (
            <div className="mt-8">
              <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                <div>
                  <h2 className="break-all font-semibold text-slate-800">
                    {file.name}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Original size: {formatBytes(file.size)}
                    {" · "}
                    {SUPPORTED_TYPES.includes(file.type) ? file.type.split("/")[1].toUpperCase() : ""}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleReset}
                  className="self-start text-sm font-medium text-rose-600 hover:text-rose-700"
                >
                  Remove image
                </button>
              </div>

              <div className="mt-6 grid gap-6 md:grid-cols-2">
                <div className="overflow-hidden rounded-xl border border-slate-200">
                  <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                    Original Image
                  </div>
                  <div className="flex min-h-56 items-center justify-center bg-slate-100 p-4">
                    <img
                      src={previewUrl}
                      alt="Original upload preview"
                      className="max-h-72 max-w-full object-contain"
                    />
                  </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-slate-200">
                  <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                    Compressed Image
                  </div>
                  <div className="flex min-h-56 items-center justify-center bg-slate-100 p-4">
                    {compressedUrl ? (
                      <img
                        src={compressedUrl}
                        alt="Compressed image preview"
                        className="max-h-72 max-w-full object-contain"
                      />
                    ) : (
                      <p className="text-center text-sm text-slate-400">
                        Your processed image will appear here.
                      </p>
                    )}
                  </div>

                  {compressedBlob && (
                    <div className="border-t border-slate-200 p-4">
                      <p className="text-sm text-slate-600">
                        Output size: <strong>{formatBytes(compressedBlob.size)}</strong>
                      </p>
                      {savings !== null && (
                        <p className={`mt-1 text-sm font-semibold ${savings > 0 ? "text-emerald-600" : "text-amber-600"}`}>
                          {savings > 0
                            ? `${savings.toFixed(1)}% smaller`
                            : savings < 0
                              ? `${Math.abs(savings).toFixed(1)}% larger`
                              : "Same file size"}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-8 rounded-xl bg-slate-50 p-5 sm:p-6">
                <h3 className="text-lg font-bold text-slate-900">
                  Compression Settings
                </h3>

                <div className="mt-5">
                  <div className="flex items-center justify-between gap-3">
                    <label htmlFor="quality" className="text-sm font-medium text-slate-700">
                      Image quality
                    </label>
                    <span className="rounded-md bg-white px-3 py-1 text-sm font-bold text-rose-600 shadow-sm">
                      {Math.round(quality * 100)}%
                    </span>
                  </div>

                  <input
                    id="quality"
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.05"
                    value={quality}
                    onChange={(event) => setQuality(Number(event.target.value))}
                    disabled={outputFormat === "image/png"}
                    className="mt-4 w-full accent-rose-600 disabled:cursor-not-allowed disabled:opacity-40"
                  />

                  <div className="mt-1 flex justify-between text-xs text-slate-500">
                    <span>Smaller file</span>
                    <span>Higher quality</span>
                  </div>

                  {outputFormat === "image/png" && (
                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      PNG is lossless; browsers do not apply this quality
                      slider to PNG output. Choose WebP or JPEG for lossy compression.
                    </p>
                  )}
                </div>

                <div className="mt-6">
                  <label htmlFor="output-format" className="text-sm font-medium text-slate-700">
                    Output format
                  </label>

                  <select
                    id="output-format"
                    value={outputFormat}
                    onChange={(event) => setOutputFormat(event.target.value)}
                    className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100 sm:max-w-xs"
                  >
                    {Object.entries(OUTPUT_FORMATS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleCompress}
                  disabled={isCompressing}
                  className="mt-7 w-full rounded-lg bg-rose-600 px-6 py-3.5 font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  {isCompressing ? "Processing image..." : "Compress Image"}
                </button>

                {message && (
                  <p role="status" className="mt-4 text-sm leading-6 text-slate-600">
                    {message}
                  </p>
                )}

                {compressedUrl && (
                  <a
                    href={compressedUrl}
                    download={`fileflow-compressed.${outputFormat.split("/")[1]}`}
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-rose-200 bg-white px-6 py-3.5 font-semibold text-rose-700 transition hover:bg-rose-50 sm:ml-3 sm:w-auto"
                  >
                    Download Image
                    <span aria-hidden="true">↓</span>
                  </a>
                )}
              </div>
            </div>
          )}
        </section>

        <p className="mt-6 text-center text-sm leading-6 text-slate-500">
          Image processing happens in your browser. Your selected image is
          processed locally by this page and is not uploaded to a server by this component.
        </p>
      </div>
    </main>
  );
}

export default ImageCompressor;
