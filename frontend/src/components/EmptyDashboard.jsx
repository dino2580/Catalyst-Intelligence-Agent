import { BarChart3, UploadCloud, Database, Info, LineChart, FileJson, Zap, ArrowRight } from "lucide-react";

export default function EmptyDashboard() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] w-full items-center justify-center p-6 text-center overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-indigo-50 rounded-full blur-3xl opacity-50 -z-10 animate-pulse"></div>
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-emerald-50 rounded-full blur-3xl opacity-50 -z-10"></div>

      <div className="max-w-4xl w-full space-y-12">
        {/* Hero Section */}
        <div className="space-y-6">
          <div className="relative mx-auto flex h-32 w-32 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-2xl shadow-indigo-200 rotate-3">
            <BarChart3 size={56} />
            <div className="absolute -right-4 -top-4 flex h-12 w-12 animate-bounce items-center justify-center rounded-xl bg-white shadow-xl">
              <Zap size={24} className="text-amber-500" />
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight sm:text-5xl">
              Catalyst <span className="text-indigo-600">Intelligence</span> Platform
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
              Transform raw experimental data into actionable research insights. Our AI-driven engine ranks catalysts based on your specific operational constraints.
            </p>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: <Database size={20} />, title: "Data Ingestion", desc: "Upload CSV/Excel research datasets seamlessly.", color: "emerald" },
            { icon: <LineChart size={20} />, title: "Performance Ranking", desc: "Compare catalysts across 10+ operational scenarios.", color: "indigo" },
            { icon: <FileJson size={20} />, title: "Advanced Metrics", desc: "Deep dive into conversion, selectivity, and STY.", color: "amber" },
            { icon: <Info size={20} />, title: "Scientific Logic", desc: "Transparent scoring based on chemical principles.", color: "rose" }
          ].map((feature, i) => (
            <div key={i} className="group relative rounded-2xl border border-slate-100 bg-white p-6 shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
              <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-${feature.color}-50 text-${feature.color}-600 group-hover:scale-110 transition-transform`}>
                {feature.icon}
              </div>
              <h3 className="font-bold text-slate-900 text-sm">{feature.title}</h3>
              <p className="mt-2 text-xs text-slate-500 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* How it works */}
        <div className="pt-8 border-t border-slate-100">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-8">Get Started in 3 Steps</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-12">
            {[
              { step: "01", text: "Upload your raw data file" },
              { step: "02", text: "Select a research scenario" },
              { step: "03", text: "Export optimized results" }
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-2xl font-black text-slate-100">{step.step}</span>
                <span className="text-sm font-medium text-slate-600">{step.text}</span>
                {i < 2 && <ArrowRight size={16} className="text-slate-300 hidden sm:block ml-4" />}
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 py-4">
          <div className="h-px w-12 bg-slate-100"></div>
          <p className="text-xs font-medium text-slate-400 italic">Select a dataset from the sidebar to begin</p>
          <div className="h-px w-12 bg-slate-100"></div>
        </div>
      </div>
    </div>
  );
}
