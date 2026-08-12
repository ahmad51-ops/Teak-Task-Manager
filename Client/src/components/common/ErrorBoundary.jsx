import { Component } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

// Error boundaries MUST be class components — there's still no hook
// equivalent of getDerivedStateFromError/componentDidCatch in React as
// of this app's dependency versions. This is the one deliberate
// exception to the function-components-everywhere style used elsewhere
// in this codebase.
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // In a real production setup this is where you'd forward to an
    // error-tracking service (Sentry, etc.) — kept as a console.error
    // for now since none is wired up.
    console.error("Uncaught render error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    // A full reload is the safest recovery — component state that led
    // to the crash might still be sitting in a parent that didn't
    // unmount, and a soft reset risks immediately re-triggering it.
    window.location.href = "/dashboard";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-void px-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-rose-neon/30 bg-rose-neon/10 text-rose-neon">
            <AlertTriangle size={26} />
          </div>
          <div>
            <h1 className="font-display text-xl font-semibold text-ink-primary">
              Something went wrong
            </h1>
            <p className="mt-1.5 max-w-sm text-sm text-ink-muted">
              This part of the app hit an unexpected error. The rest of your
              data is safe — try heading back to the dashboard.
            </p>
          </div>
          <button
            onClick={this.handleReset}
            className="mt-2 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-neon to-cyan-neon px-4 py-2.5 text-sm font-semibold text-void hover:shadow-glow-cyan"
          >
            <RotateCcw size={15} /> Back to dashboard
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
