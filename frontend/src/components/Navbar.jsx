import { Atom, LogOut } from "lucide-react";

export default function Navbar({ onLogout }) {
  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur sticky top-0 z-40">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm">
            <Atom size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
              Catalyst AI Recommendation System
            </h1>
            <p className="text-sm text-slate-500">
              Scenario-based catalyst ranking
            </p>
          </div>
        </div>
        <button 
          onClick={onLogout}
          className="inline-flex w-fit items-center gap-2 rounded-lg border border-slate-200 bg-white hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 px-4 py-2.5 text-sm font-semibold text-slate-600 transition-all shadow-sm active:scale-95"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </header>
  );
}
