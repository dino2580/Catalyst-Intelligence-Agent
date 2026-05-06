import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const shorten = (name = "") => {
  if (name.length <= 16) return name;
  return `${name.slice(0, 14)}...`;
};

export default function ScoreChart({ results, onInspect }) {
  const data = (results || []).slice(0, 5).map((item) => ({
    ...item,
    name: item.catalyst_name || "Unknown",
    score: Number(item.scenario_score || 0),
  }));

  if (!data.length) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
        Select a scenario to view score distribution.
      </div>
    );
  }

  return (
    <div className="h-72 rounded-lg border border-slate-200 bg-white p-3">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 12, right: 10, left: -12, bottom: 40 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis
            dataKey="name"
            tickFormatter={shorten}
            tick={{ fontSize: 10, fill: "#475569" }}
            interval={0}
            height={60}
            angle={-35}
            textAnchor="end"
          />
          <YAxis tick={{ fontSize: 11, fill: "#475569" }} domain={[0, 1]} />
          <Tooltip
            cursor={{ fill: "#eef2ff" }}
            formatter={(value, key, item) => {
              if (key === "score") return [Number(value).toFixed(3), "Scenario score"];
              return [value, item.name];
            }}
            labelFormatter={(label) => label}
            contentStyle={{
              borderRadius: 8,
              border: "1px solid #e2e8f0",
              boxShadow: "0 10px 25px rgba(15, 23, 42, 0.12)",
            }}
          />
          <Bar 
            dataKey="score" 
            fill="#4f46e5" 
            radius={[4, 4, 0, 0]} 
            onClick={(data) => onInspect && onInspect(data.payload)}
            className="cursor-pointer transition-opacity hover:opacity-80"
            style={{ cursor: 'pointer' }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

