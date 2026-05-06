import { Component } from "react";
import { AlertTriangle } from "lucide-react";

export default class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <section className="max-w-xl rounded-lg border border-rose-200 bg-white p-6 shadow-soft">
          <div className="mb-4 flex items-center gap-3 text-rose-700">
            <AlertTriangle size={24} />
            <h1 className="text-xl font-bold text-slate-950">The dashboard could not start</h1>
          </div>
          <p className="text-sm leading-6 text-slate-600">
            Refresh the page once. If this message remains, open the same URL in Chrome or Edge and
            clear this site's browser data.
          </p>
          <pre className="mt-4 max-h-48 overflow-auto rounded-lg bg-slate-950 p-3 text-xs text-slate-100">
            {this.state.error?.message || "Unknown browser error"}
          </pre>
        </section>
      </main>
    );
  }
}
