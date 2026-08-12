import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

// Usage: <Route element={<RoleRoute allowedRoles={["admin"]} />}>...</Route>
// Nest inside PrivateRoute — this assumes the user is already logged in
// and only checks WHICH role they have. Frontend gating is UX only; the
// backend's restrictTo() middleware is the actual security boundary.
const RoleRoute = ({ allowedRoles }) => {
  const { user } = useAuth();

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default RoleRoute;
