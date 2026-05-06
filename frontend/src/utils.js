export const downloadRankingCsv = (rows, scenario) => {
  const headers = [
    "rank",
    "catalyst_name",
    "conversion_pct",
    "selectivity_pct",
    "yield_pct",
    "temperature_c",
    "pressure_bar",
    "scenario_score",
    "patent_number",
    "evidence",
  ];
  const escape = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const csv = [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => escape(row[header])).join(",")),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${scenario || "scenario"}_ranking.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
