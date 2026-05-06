import { useEffect, useState } from "react";
import { BarChart3, Loader2, Download, X } from "lucide-react";
import { getSummary, rankScenario } from "./api";
import DatasetSummary from "./components/DatasetSummary";
import Navbar from "./components/Navbar";
import RankingTable from "./components/RankingTable";
import ScenarioCards from "./components/ScenarioCards";
import ScoreChart from "./components/ScoreChart";
import UploadCard from "./components/UploadCard";
import DatasetList from "./components/DatasetList";
import { downloadRankingCsv } from "./utils";
import EmptyDashboard from "./components/EmptyDashboard";
import LoginPage from "./components/LoginPage";
import AnalysisModal from "./components/AnalysisModal";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem("isLoggedIn") === "true";
  });
  const [hasDataset, setHasDataset] = useState(false);
  const [summary, setSummary] = useState(null);
  const [ranking, setRanking] = useState(null);
  const [selectedScenario, setSelectedScenario] = useState("overall");
  const [rankLoading, setRankLoading] = useState(false);
  const [rankError, setRankError] = useState("");
  const [activeDataset, setActiveDataset] = useState(null);
  const [uploadTrigger, setUploadTrigger] = useState(0);
  const [showFullRanking, setShowFullRanking] = useState(false);
  const [inspectedCatalyst, setInspectedCatalyst] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    const loadExistingSummary = async () => {
      try {
        const data = await getSummary();
        setSummary(data);
        setHasDataset(true);
      } catch {
        setHasDataset(false);
      }
    };
    loadExistingSummary();
  }, [isAuthenticated]);

  const handleLogin = () => {
    setIsAuthenticated(true);
    localStorage.setItem("isLoggedIn", "true");
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("isLoggedIn");
    // Clear dataset state for a clean login next time
    setActiveDataset(null);
    setSummary(null);
    setRanking(null);
    setHasDataset(false);
    setSelectedScenario("overall");
  };

  const runRanking = async (scenario) => {
    if (!hasDataset) {
      setRankError("Select a dataset before running scenario ranking.");
      return;
    }
    setSelectedScenario(scenario);
    setRankLoading(true);
    setRankError("");
    try {
      const data = await rankScenario(scenario);
      setRanking(data);
    } catch (error) {
      setRankError(error.response?.data?.detail || "Could not calculate ranking.");
    } finally {
      setRankLoading(false);
    }
  };

  const handleUploadSuccess = async (result) => {
    setUploadTrigger(prev => prev + 1);
    handleDatasetSelect(result.filename, result);
  };

  const handleDatasetSelect = async (filename, result) => {
    if (!filename) {
      setActiveDataset(null);
      setSummary(null);
      setHasDataset(false);
      setRanking(null);
      return;
    }
    setActiveDataset(filename);
    setSummary(result.summary);
    setHasDataset(true);
    setRankLoading(true);
    setRankError("");
    setSelectedScenario("overall");
    try {
      const data = await rankScenario("overall");
      setRanking(data);
    } catch (error) {
      setRankError(error.response?.data?.detail || "Dataset selected, but ranking failed.");
    } finally {
      setRankLoading(false);
    }
  };

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar onLogout={handleLogout} />

      <main className="mx-auto grid max-w-[1600px] gap-6 px-4 py-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:px-6">
        <aside className="space-y-6">
          <UploadCard onUploadSuccess={handleUploadSuccess} hasDataset={hasDataset} />
          <DatasetList 
            onDatasetSelect={handleDatasetSelect} 
            activeDataset={activeDataset} 
            uploadTrigger={uploadTrigger} 
          />
        </aside>

        <section className="space-y-4">
          {!activeDataset ? (
            <EmptyDashboard />
          ) : (
            <>
              {summary && <DatasetSummary summary={summary} />}
              <ScenarioCards
                selectedScenario={selectedScenario}
                onSelect={runRanking}
                loading={rankLoading}
                hasDataset={hasDataset}
              />
              
              <section className="panel p-5 relative">
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <p className="field-label">Ranking Results</p>
                    <h2 className="mt-1 flex items-center gap-2 text-lg font-bold text-slate-950">
                      <BarChart3 size={20} className="text-indigo-600" />
                      Top catalyst recommendations
                    </h2>
                  </div>
                  <div className="flex items-center gap-3">
                    {rankLoading && (
                      <span className="inline-flex items-center gap-2 rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-700">
                        <Loader2 size={16} className="animate-spin" />
                        Ranking
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid lg:grid-cols-[1fr_1.5fr] gap-6 items-start">
                  <ScoreChart results={ranking?.top_results} onInspect={setInspectedCatalyst} />
                  <div className="space-y-3 min-w-0">
                    {ranking && (
                      <div>
                        <p className="text-sm font-bold text-slate-900">{ranking.scenario_label}</p>
                        <p className="text-xs text-slate-500 line-clamp-2">{ranking.explanation}</p>
                      </div>
                    )}
                    <RankingTable 
                      ranking={ranking} 
                      loading={rankLoading} 
                      error={rankError} 
                      limit={3}
                      onViewAll={() => setShowFullRanking(true)}
                      onInspect={setInspectedCatalyst}
                    />
                  </div>
                </div>
              </section>
            </>
          )}
        </section>
      </main>

      {showFullRanking && ranking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-[90vw] max-h-[90vh] overflow-hidden rounded-xl bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h3 className="text-xl font-bold text-slate-950">Full Analysis Results</h3>
                <p className="text-sm text-slate-500">{ranking.scenario_label}</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  title="Download Ranking CSV"
                  className="h-10 px-4 flex items-center gap-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition shadow-sm font-medium text-sm"
                  onClick={() => downloadRankingCsv(ranking.top_results, ranking.scenario)}
                >
                  <Download size={18} />
                  Download CSV
                </button>
                <button 
                  onClick={() => setShowFullRanking(false)}
                  className="h-10 w-10 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 transition"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-6">
              <RankingTable 
                ranking={ranking} 
                loading={false} 
                error={null} 
                onInspect={setInspectedCatalyst}
              />
            </div>
          </div>
        </div>
      )}

      <AnalysisModal 
        isOpen={!!inspectedCatalyst} 
        onClose={() => setInspectedCatalyst(null)} 
        catalyst={inspectedCatalyst} 
        ranking={ranking} 
      />
    </div>
  );
}

