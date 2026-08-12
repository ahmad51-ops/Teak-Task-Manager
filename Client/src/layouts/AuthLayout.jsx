import { Link } from "react-router-dom";
import PageTransition from "../components/common/PageTransition";

const AuthLayout = () => (
  <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-void px-4">
    {/* Ambient drifting glow — echoes the sidebar's pulse rail motif */}
    <div className="pointer-events-none absolute inset-0 bg-aurora-gradient" />
    <div className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 animate-drift rounded-full bg-violet-neon/20 blur-3xl" />
    <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 animate-drift-reverse rounded-full bg-cyan-neon/20 blur-3xl" />
    <div className="pointer-events-none absolute inset-0 bg-grid-pattern bg-grid opacity-40" />

    <div className="relative z-10 w-full max-w-lg">
      <Link to="/login" className="mb-8 flex items-center justify-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-cyan-neon shadow-glow-cyan animate-pulse-slow" />
        <span className="font-display text-2xl font-semibold tracking-tight text-ink-primary">
          NOVA
        </span>
      </Link>
      <div className="glass-panel rounded-2xl p-9 shadow-2xl">
        <PageTransition />
      </div>
    </div>
  </div>
);

export default AuthLayout;
