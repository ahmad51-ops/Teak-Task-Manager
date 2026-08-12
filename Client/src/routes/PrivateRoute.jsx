import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

const PrivateRoute = () => {
  const { isAuthenticated, isBootstrapping } = useAuth();
  const location = useLocation();

  // Still checking for a restorable session (via the refresh cookie) —
  // showing nothing/redirecting here would flash the user to /login
  // even when they actually do have a valid session.
  if (isBootstrapping) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-void">
        <Loader2 className="animate-spin text-cyan-neon" size={28} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export default PrivateRoute;
