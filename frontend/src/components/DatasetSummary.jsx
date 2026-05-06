import { Activity, Database, Gauge, Percent, Thermometer, Rows3, Sigma } from "lucide-react";

const Stat = ({ icon: Icon, label, value, accent = "text-indigo-600" }) => (
  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
    <div className="mb-2 flex items-center justify-between gap-3">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      <Icon size={17} className={accent} />
    </div>
    <p className="text-lg font-bold text-slate-950">{value}</p>
  </div>
);

const formatRange = (range, suffix = "") => {
  if (!range || range.min === null || range.max === null) return "Not detected";
  return `${range.min}${suffix} - ${range.max}${suffix}`;
};

export default function DatasetSummary({ summary }) {
  if (!summary) {
    return (
      <section className="panel p-5">
        <p className="field-label">Dataset Summary</p>
        <h2 className="mt-1 text-lg font-bold text-slate-950">No dataset loaded</h2>
      </section>
    );
  }

  return (
    <section className="panel p-5">
      <div className="mb-4">
        <p className="field-label">Dataset Summary</p>
        <h2 className="mt-1 text-lg font-bold text-slate-950">Processed catalyst table</h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
        <Stat icon={Rows3} label="Rows" value={summary.total_rows ?? 0} />
        <Stat icon={Database} label="Columns" value={summary.total_columns ?? 0} accent="text-cyan-600" />
        <Stat icon={Sigma} label="Catalysts" value={summary.number_of_catalysts ?? 0} accent="text-emerald-600" />
        <Stat icon={Activity} label="Conversion" value={formatRange(summary.conversion_range, "%")} accent="text-blue-600" />
        <Stat icon={Percent} label="Selectivity" value={formatRange(summary.selectivity_range, "%")} accent="text-violet-600" />
        <Stat icon={Thermometer} label="Temperature" value={formatRange(summary.temperature_range, " °C")} accent="text-rose-600" />
        <Stat icon={Gauge} label="Pressure" value={formatRange(summary.pressure_range, " bar")} accent="text-amber-600" />
      </div>

      <div className="mt-5 border-t border-slate-100 pt-4">
        <p className="text-sm leading-relaxed text-slate-600">
          <strong className="text-slate-900 font-semibold">Reaction Overview:</strong> {summary.reaction_overview || "Analyzing reaction details..."}
        </p>
      </div>
    </section>
  );
}

