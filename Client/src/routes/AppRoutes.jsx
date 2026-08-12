import { lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import AuthLayout from "../layouts/AuthLayout";
import PrivateRoute from "./PrivateRoute";
import RoleRoute from "./RoleRoute";
import NotFound from "../pages/NotFound";

// Every page is its own JS chunk, fetched only when that route is
// actually visited — someone landing on /login never downloads the
// Dashboard/Projects/Tasks code until they navigate there. The
// Suspense boundary that shows a loading state while each chunk
// downloads lives inside PageTransition.jsx (used by both MainLayout
// and AuthLayout's Outlet) — deliberately NOT wrapped around this
// whole file, which would suspend the layout chrome itself (sidebar,
// navbar) on every navigation instead of just the content area.
const Login = lazy(() => import("../pages/Login"));
const Register = lazy(() => import("../pages/Register"));
const Dashboard = lazy(() => import("../pages/Dashboard"));
const Projects = lazy(() => import("../pages/Projects"));
const ProjectDetails = lazy(() => import("../pages/ProjectDetails"));
const Tasks = lazy(() => import("../pages/Tasks"));
const TaskDetails = lazy(() => import("../pages/TaskDetails"));
const Profile = lazy(() => import("../pages/Profile"));
const Settings = lazy(() => import("../pages/Settings"));
const Members = lazy(() => import("../pages/Members"));

const AppRoutes = () => (
  <Routes>
    <Route element={<AuthLayout />}>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
    </Route>

    <Route element={<PrivateRoute />}>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/:id" element={<ProjectDetails />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/tasks/:id" element={<TaskDetails />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />

        {/* Admin-only. RoleRoute redirects everyone else to the
            dashboard; the backend's restrictTo("admin") on
            /users/directory is the real enforcement. */}
        <Route element={<RoleRoute allowedRoles={["admin"]} />}>
          <Route path="/members" element={<Members />} />
        </Route>
      </Route>
    </Route>

    <Route path="*" element={<NotFound />} />
  </Routes>
);

export default AppRoutes;
