import { useState } from "react";
import { Atom, Lock, Mail, ArrowRight, ShieldCheck } from "lucide-react";

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("admin@catalyst.ai");
  const [password, setPassword] = useState("catalyst2026");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      onLogin();
      setLoading(false);
    }, 1200);
  };

  return (
    <div className="flex min-h-screen w-full">
      {/* Left side: Hero/Branding */}
      <div className="hidden lg:flex w-1/2 bg-indigo-600 p-12 flex-col justify-center text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.26),transparent_28%),radial-gradient(circle_at_78%_36%,rgba(16,185,129,0.28),transparent_24%),linear-gradient(135deg,#312e81,#4f46e5_48%,#0f766e)]"></div>
        <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(255,255,255,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.18)_1px,transparent_1px)] [background-size:44px_44px]"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-indigo-950/70 to-transparent"></div>
        
        <div className="relative z-10 mb-20">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
              <Atom size={28} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Catalyst Intelligence</h1>
          </div>
        </div>

        <div className="relative z-10 max-w-lg">
          <h2 className="text-5xl font-black leading-tight mb-6">
            Accelerating Scientific <br />
            <span className="text-indigo-200">Discovery.</span>
          </h2>
          <p className="text-lg text-indigo-100 leading-relaxed">
            Access our advanced AI engine for catalyst optimization and experimental data analysis. Built for research teams and industrial laboratories.
          </p>
        </div>
      </div>

      {/* Right side: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:hidden">
             <div className="h-16 w-16 rounded-2xl bg-indigo-600 text-white mx-auto flex items-center justify-center mb-6">
              <Atom size={36} />
            </div>
            <h2 className="text-3xl font-bold text-slate-900">Catalyst Intelligence</h2>
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-extrabold text-slate-900">Sign in</h2>
            <p className="text-slate-500 font-medium text-sm">Enter your credentials to access the dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1" htmlFor="email">
                  Business Email
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                    <Mail size={18} />
                  </div>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none text-slate-900"
                    placeholder="name@company.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider" htmlFor="password">
                    Password
                  </label>
                  <a href="#" className="text-xs font-bold text-indigo-600 hover:text-indigo-700">Forgot?</a>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                    <Lock size={18} />
                  </div>
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none text-slate-900"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-indigo-100 transition-all active:scale-95 disabled:opacity-70"
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  Continue to Analysis
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="pt-8 border-t border-slate-200 flex flex-col items-center gap-4">
            <div className="flex items-center gap-2 text-slate-500 text-sm">
              <ShieldCheck size={16} className="text-emerald-500" />
              <span>Enterprise Grade Security</span>
            </div>
            <p className="text-xs text-slate-400 text-center leading-relaxed">
              By signing in, you agree to our <a href="#" className="underline">Terms of Service</a> and <a href="#" className="underline">Privacy Policy</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
