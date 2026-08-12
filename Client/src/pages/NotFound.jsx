import { Link } from "react-router-dom";
import { Compass } from "lucide-react";
import Button from "../components/ui/Button";

const NotFound = () => (
  <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-void px-4 text-center">
    <div className="pointer-events-none absolute inset-0 bg-aurora-gradient" />
    <div className="pointer-events-none absolute inset-0 bg-grid-pattern bg-grid opacity-30" />

    <div className="relative z-10">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-neon/30 bg-cyan-neon/10 text-cyan-neon shadow-glow-cyan-sm">
        <Compass size={28} />
      </div>
      <p className="mb-2 font-mono text-sm text-cyan-neon">404 — off the map</p>
      <h1 className="mb-3 font-display text-3xl font-semibold text-ink-primary">
        This page doesn't exist
      </h1>
      <p className="mx-auto mb-8 max-w-sm text-sm text-ink-muted">
        The link might be broken, or the page may have moved. Let's get you back on course.
      </p>
      <Link to="/dashboard">
        <Button>Back to dashboard</Button>
      </Link>
    </div>
  </div>
);

export default NotFound;
