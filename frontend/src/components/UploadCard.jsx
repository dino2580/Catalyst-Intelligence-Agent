import { useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Download, FileSpreadsheet, UploadCloud } from "lucide-react";
import { processedDownloadUrl, uploadDataset } from "../api";

const STAGES = [
  "Uploading dataset...",
  "Processing catalyst fields...",
  "Normalizing conditions...",
  "Building ranking engine...",
];

export default function UploadCard({ onUploadSuccess, hasDataset }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stageIndex, setStageIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (!loading) return undefined;
    const timer = window.setInterval(() => {
      setStageIndex((current) => Math.min(current + 1, STAGES.length - 1));
      setProgress((current) => Math.min(current + 18, 92));
    }, 700);
    return () => window.clearInterval(timer);
  }, [loading]);

  const handleFileAction = async (file) => {
    setError("");
    setSuccess("");
    if (!file) return;

    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!["csv", "xlsx", "xls"].includes(extension)) {
      setError("Unsupported file type. Please upload a CSV or Excel file.");
      return;
    }

    setSelectedFile(file);
    setLoading(true);
    setStageIndex(0);
    setProgress(8);

    try {
      const result = await uploadDataset(file, (event) => {
        if (!event.total) return;
        const uploadPercent = Math.round((event.loaded * 45) / event.total);
        setProgress(Math.max(8, uploadPercent));
      });
      setProgress(100);
      setSuccess(result.message || "Dataset processed successfully.");
      onUploadSuccess(result);
    } catch (requestError) {
      const detail =
        requestError.response?.data?.detail ||
        "Backend unavailable or unable to process this dataset.";
      setError(detail);
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    handleFileAction(event.dataTransfer.files?.[0]);
  };

  return (
    <section className="panel p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="field-label">Dataset Upload</p>
          <h2 className="mt-1 text-lg font-bold text-slate-950">Raw catalyst data</h2>
        </div>
        <FileSpreadsheet className="text-indigo-600" size={24} />
      </div>

      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") inputRef.current?.click();
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-6 text-center transition ${
          isDragging
            ? "border-indigo-400 bg-indigo-50"
            : "border-slate-200 bg-slate-50 hover:border-indigo-300 hover:bg-indigo-50/60"
        }`}
      >
        <UploadCloud className="mb-3 text-indigo-600" size={34} />
        <p className="text-sm font-semibold text-slate-800 truncate w-full px-4">
          {loading ? "Processing..." : selectedFile ? selectedFile.name : "Drop Excel or CSV dataset here"}
        </p>
        <p className="mt-1 text-xs text-slate-500">.xlsx, .xls, .csv</p>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept=".xlsx,.xls,.csv"
          onChange={(event) => handleFileAction(event.target.files?.[0])}
          disabled={loading}
        />
      </div>

      {loading && (
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-slate-700">{STAGES[stageIndex]}</span>
            <span className="text-slate-500">{progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-indigo-600 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 flex gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mt-4 flex gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
          <span>{success}</span>
        </div>
      )}
    </section>
  );
}
