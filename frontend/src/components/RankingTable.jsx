import { useState } from "react";
import { AlertCircle, BarChart3, Download, Info, Medal, X } from "lucide-react";

const numberCell = (value, suffix = "") => {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "number") return `${value.toFixed(value >= 10 ? 1 : 3)}${suffix}`;
  return `${value}${suffix}`;
};

const confidenceClass = (badge) => {
  if (badge === "High confidence") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (badge === "Medium confidence") return "border-amber-200 bg-amber-50 text-amber-800";
  return "border-slate-200 bg-slate-50 text-slate-600";
};

export default function RankingTable({ ranking, loading, error, limit, onViewAll, onInspect }) {
  const allRows = ranking?.top_results || [];
  const rows = limit ? allRows.slice(0, limit) : allRows;

  if (error) {
    return (
      <div className="flex gap-2 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
        <AlertCircle size={18} className="mt-0.5 shrink-0" />
        <span>{error}</span>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="h-12 animate-pulse rounded-lg bg-slate-100" />
        ))}
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
        Rankings will appear here after a dataset is uploaded and a scenario is selected.
      </div>
    );
  }

  return (
    <>
      {ranking.missing_fields?.length > 0 && (
        <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Missing preferred fields for this scenario: {ranking.missing_fields.join(", ")}.
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-slate-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-3 text-left">Rank</th>
                <th className="px-3 py-3 text-left">Catalyst</th>
                <th className="px-3 py-3 text-right">Conv.</th>
                <th className="px-3 py-3 text-right">Select.</th>
                <th className="px-3 py-3 text-right">Yield</th>
                <th className="px-3 py-3 text-right">Temp.</th>
                <th className="px-3 py-3 text-right">Pressure</th>
                <th className="px-3 py-3 text-center">Why</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {rows.map((row) => (
                <tr
                  key={`${row.rank}-${row.original_row_index}`}
                  className={row.rank === 1 ? "bg-indigo-50/70" : "hover:bg-slate-50"}
                >
                  <td className="whitespace-nowrap px-3 py-3 font-semibold text-slate-900">
                    <span className="inline-flex items-center gap-1">
                      {row.rank === 1 && <Medal size={16} className="text-amber-500" />}
                      {row.rank}
                    </span>
                  </td>
                  <td className="min-w-44 px-3 py-3">
                    <p className="font-semibold text-slate-900">{row.catalyst_name || "Unknown"}</p>
                    <span
                      className={`mt-1 inline-flex rounded-lg border px-2 py-0.5 text-xs font-medium ${confidenceClass(
                        row.confidence_badge,
                      )}`}
                    >
                      {row.confidence_badge}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right">{numberCell(row.conversion_pct, "%")}</td>
                  <td className="px-3 py-3 text-right">{numberCell(row.selectivity_pct, "%")}</td>
                  <td className="px-3 py-3 text-right">{numberCell(row.yield_pct, "%")}</td>
                  <td className="px-3 py-3 text-right">{numberCell(row.temperature_c, " °C")}</td>
                  <td className="px-3 py-3 text-right">{numberCell(row.pressure_bar, " bar")}</td>
                  <td className="px-3 py-3 text-center">
                    <button
                      type="button"
                      className="icon-button h-8 w-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 transition"
                      title="Why this catalyst?"
                      onClick={() => onInspect && onInspect(row)}
                    >
                      <Info size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {limit && allRows.length > limit && (
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={onViewAll}
            className="flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-6 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 transition shadow-sm"
          >
            <BarChart3 size={16} />
            View all {allRows.length} results
          </button>
        </div>
      )}
    </>
  );
}
