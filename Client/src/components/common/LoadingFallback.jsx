import { Loader2 } from "lucide-react";

// Shown briefly while a route's JS chunk downloads (see React.lazy in
// AppRoutes.jsx) — same visual language as PrivateRoute's bootstrap
// spinner, so a page navigation and an auth check feel like the same
// kind of "just a moment" rather than two different loading styles.
const LoadingFallback = () => (
  <div className="flex min-h-[60vh] items-center justify-center">
    <Loader2 className="animate-spin text-cyan-neon" size={28} />
  </div>
);

export default LoadingFallback;
