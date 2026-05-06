import { useEffect, useState } from "react";
import { Database, Loader2, CheckCircle2, X } from "lucide-react";
import { getDatasets, selectDataset, deleteDataset } from "../api";

export default function DatasetList({ onDatasetSelect, activeDataset, uploadTrigger }) {
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selecting, setSelecting] = useState(null);

  useEffect(() => {
    const fetchDatasets = async () => {
      setLoading(true);
      try {
        const data = await getDatasets();
        setDatasets(data.datasets || []);
      } catch (err) {
        setError("Could not load datasets.");
      } finally {
        setLoading(false);
      }
    };
    fetchDatasets();
  }, [uploadTrigger]);

  const handleSelect = async (filename) => {
    if (filename === activeDataset) return;
    
    setSelecting(filename);
    setError("");
    try {
      const result = await selectDataset(filename);
      onDatasetSelect(filename, result);
    } catch (err) {
      setError(err.response?.data?.detail || "Could not select dataset.");
    } finally {
      setSelecting(null);
    }
  };

  const handleDelete = async (e, filename) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete ${filename}?`)) return;
    
    try {
      await deleteDataset(filename);
      setDatasets(prev => prev.filter(d => d !== filename));
      if (filename === activeDataset) {
        // Just refresh the whole app state by informing parent it's gone
        onDatasetSelect(null, { summary: null });
      }
    } catch (err) {
      setError("Could not delete dataset.");
    }
  };

  return (
    <section className="panel p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="field-label">Uploaded Datasets</p>
          <h2 className="mt-1 text-lg font-bold text-slate-950">Select a dataset</h2>
        </div>
        <Database className="text-indigo-600" size={24} />
      </div>

      {error && (
        <div className="mb-4 text-sm text-rose-600 bg-rose-50 p-2 rounded">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center p-4 text-slate-500">
          <Loader2 size={24} className="animate-spin" />
        </div>
      ) : datasets.length === 0 ? (
        <div className="text-sm text-slate-500 text-center py-4">
          No datasets uploaded yet.
        </div>
      ) : (
        <ul className="space-y-2">
          {datasets.map((filename) => {
            const isActive = filename === activeDataset;
            const isSelecting = selecting === filename;
            return (
              <li key={filename} className="group relative">
                <button
                  onClick={() => handleSelect(filename)}
                  disabled={selecting !== null}
                  className={`w-full text-left px-4 py-3 rounded-lg border transition flex items-center justify-between pr-10 ${
                    isActive
                      ? "border-indigo-600 bg-indigo-50 text-indigo-900 font-medium"
                      : "border-slate-200 hover:border-indigo-300 hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <span className="truncate flex-1">{filename}</span>
                  {isSelecting && <Loader2 size={16} className="animate-spin text-indigo-500 ml-2" />}
                  {isActive && !isSelecting && <CheckCircle2 size={18} className="text-indigo-600 ml-2" />}
                </button>
                <button
                  onClick={(e) => handleDelete(e, filename)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center rounded-md text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition opacity-0 group-hover:opacity-100"
                  title="Delete dataset"
                >
                  <X size={16} />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
