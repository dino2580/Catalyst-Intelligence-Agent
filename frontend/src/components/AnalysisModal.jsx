import { BarChart3, Info, X } from "lucide-react";

export default function AnalysisModal({ isOpen, onClose, catalyst, ranking }) {
  if (!isOpen || !catalyst || !ranking) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="field-label">Score Calculation & Details</p>
            <h3 className="mt-1 text-xl font-bold text-slate-950">{catalyst.catalyst_name}</h3>
          </div>
          <button 
            className="icon-button h-10 w-10 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 transition" 
            type="button" 
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto pr-2 custom-scrollbar">
          <div className="mb-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
              <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">Support</dt>
              <dd className="mt-1 text-sm font-medium text-slate-900">{catalyst.support || "Not reported"}</dd>
            </div>
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
              <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">Promoter</dt>
              <dd className="mt-1 text-sm font-medium text-slate-900">{catalyst.promoter || "Not reported"}</dd>
            </div>
          </div>

          <h4 className="mb-3 text-sm font-bold text-slate-900">Score Breakdown ({ranking.scenario_label})</h4>
          <div className="rounded-lg border border-slate-200 overflow-hidden">
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead className="bg-slate-50 font-semibold text-slate-600">
                <tr>
                  <th className="px-4 py-2 text-left">Component</th>
                  <th className="px-4 py-2 text-right">Value (Norm)</th>
                  <th className="px-4 py-2 text-right">Weight</th>
                  <th className="px-4 py-2 text-right">Contribution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {Object.entries(ranking.weights_used || {}).map(([key, weight]) => {
                  const value = catalyst[key] || 0;
                  const contrib = value * weight;
                  const label = key.replace("_norm", "").replace("_score", "").replace("_penalty", "").replace("_", " ");
                  return (
                    <tr key={key}>
                      <td className="px-4 py-2 capitalize text-slate-700">{label}</td>
                      <td className="px-4 py-2 text-right font-mono text-slate-600">{value.toFixed(3)}</td>
                      <td className="px-4 py-2 text-right font-mono text-slate-600">x {weight.toFixed(2)}</td>
                      <td className={`px-4 py-2 text-right font-bold ${contrib < 0 ? "text-rose-600" : "text-emerald-600"}`}>
                        {contrib.toFixed(3)}
                      </td>
                    </tr>
                  );
                })}
                <tr className="bg-indigo-50 font-bold text-indigo-900">
                  <td colSpan={3} className="px-4 py-3 text-right text-sm">Final Scenario Score:</td>
                  <td className="px-4 py-3 text-right text-sm">{Number(catalyst.scenario_score).toFixed(3)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-6 rounded-lg bg-slate-50 p-4 border border-slate-200">
            <h4 className="flex items-center gap-2 text-sm font-bold text-slate-950 mb-2">
              <BarChart3 size={16} className="text-indigo-600" />
              Scenario Logic: {ranking.scenario_label}
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              {ranking.logic_details || "No specific logic details available for this scenario."}
            </p>
          </div>

          <div className="mt-4 rounded-lg bg-indigo-50/50 p-4 border border-indigo-100">
            <h4 className="flex items-center gap-2 text-sm font-bold text-indigo-950 mb-2">
              <Info size={16} />
              Scoring Methodology & Logic
            </h4>
            <div className="grid gap-4 text-xs text-slate-600 sm:grid-cols-2">
              <div className="space-y-2">
                <p>
                  <strong className="text-slate-800">Relative Normalization:</strong> Values (Norm) are calculated relative to the entire dataset. A value of <code className="bg-white px-1 rounded border">1.000</code> represents the best performer in the current batch, while <code className="bg-white px-1 rounded border">0.000</code> represents the lowest.
                </p>
                <p>
                  <strong className="text-slate-800">Scenario Weights:</strong> Weights reflect the priorities of the <strong>{ranking.scenario_label}</strong> scenario. High weights are assigned to primary goals (e.g., Conversion), while lower weights are for supporting metrics.
                </p>
              </div>
              <div className="space-y-2">
                <p>
                  <strong className="text-slate-800">Positive vs Negative:</strong> Performance metrics (Conversion, Selectivity, Yield) are rewards (positive). Operational costs (Temperature, Pressure) are treated as <strong>penalties</strong> (negative weights) to favor more practical, efficient catalysts.
                </p>
                <p>
                  <strong className="text-slate-800">Data Quality:</strong> A bonus is applied based on how much metadata (GHSV, H2/CO2 ratio, etc.) was provided in the source file, rewarding well-documented research.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
