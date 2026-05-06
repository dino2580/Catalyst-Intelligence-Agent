import {
  Activity,
  Flame,
  Gauge,
  Leaf,
  Scale,
  ShieldCheck,
  SlidersHorizontal,
  ThermometerSnowflake,
  Trophy,
  Zap,
} from "lucide-react";

export const SCENARIOS = [
  { id: "overall", title: "Best Overall", icon: Trophy, tone: "text-indigo-600" },
  { id: "high_temperature_allowed", title: "High Temp Allowed", icon: Flame, tone: "text-rose-600" },
  { id: "mild_conditions", title: "Mild Conditions", icon: Leaf, tone: "text-emerald-600" },
  { id: "max_conversion", title: "Max Conversion", icon: Activity, tone: "text-blue-600" },
  { id: "max_selectivity", title: "Max Selectivity", icon: SlidersHorizontal, tone: "text-violet-600" },
  { id: "low_pressure", title: "Low Pressure", icon: Gauge, tone: "text-cyan-600" },
  { id: "balanced_conversion_selectivity", title: "Balanced Perf.", icon: Scale, tone: "text-slate-700" },
  { id: "low_temperature", title: "Low Temperature", icon: ThermometerSnowflake, tone: "text-blue-500" },
  { id: "stable_catalyst", title: "Stable Catalyst", icon: ShieldCheck, tone: "text-teal-600" },
];


export default function ScenarioCards({ selectedScenario, onSelect, loading, hasDataset }) {
  return (
    <section className="panel p-5">
      <div className="mb-4">
        <p className="field-label">Scenarios</p>
        <h2 className="mt-1 text-lg font-bold text-slate-950">Ranking engine</h2>
      </div>

      <div className="flex flex-wrap gap-2">
        {SCENARIOS.map((scenario) => {
          const Icon = scenario.icon;
          const active = selectedScenario === scenario.id;
          return (
            <button
              key={scenario.id}
              type="button"
              disabled={!hasDataset || loading}
              onClick={() => onSelect(scenario.id)}
              className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition ${
                active
                  ? "border-indigo-300 bg-indigo-50 shadow-sm font-bold text-indigo-900"
                  : "border-slate-200 bg-white hover:border-indigo-200 hover:bg-slate-50 text-slate-700"
              } disabled:cursor-not-allowed disabled:opacity-50`}
            >
              <Icon size={16} className={scenario.tone} />
              <span>{scenario.title}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
