import { NavLink } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  LayoutDashboard,
  FolderKanban,
  ListChecks,
  User,
  Users,
  Settings as SettingsIcon,
  X,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/projects", label: "Projects", icon: FolderKanban },
  { to: "/tasks", label: "Tasks", icon: ListChecks },
  // adminOnly items are filtered out below for everyone else — the
  // route itself is also guarded by RoleRoute, and the API by
  // restrictTo("admin"). This is just so the link isn't dangled in
  // front of people who'd only get bounced by clicking it.
  { to: "/members", label: "Members", icon: Users, adminOnly: true },
  { to: "/profile", label: "Profile", icon: User },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
];

const NavList = ({ collapsed, onNavigate, items }) => (
  <nav className="flex-1 space-y-1 px-3">
    {items.map(({ to, label, icon: Icon }) => (
      <NavLink
        key={to}
        to={to}
        onClick={onNavigate}
        className={({ isActive }) =>
          `relative flex items-center gap-3 rounded-lg px-3.5 py-3 text-[15px] font-medium transition-colors ${
            isActive
              ? "text-ink-primary"
              : "text-ink-muted hover:text-ink-primary hover:bg-surface-2"
          }`
        }
      >
        {({ isActive }) => (
          <>
            {isActive && (
              <motion.span
                layoutId="active-nav-pill"
                className="absolute inset-0 rounded-lg border border-cyan-neon/30 bg-surface-2 shadow-glow-cyan-sm"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            <Icon size={21} className="relative z-10 shrink-0" />
            {!collapsed && <span className="relative z-10">{label}</span>}
            {isActive && (
              <span className="absolute right-3 z-10 h-1.5 w-1.5 rounded-full bg-cyan-neon shadow-glow-cyan" />
            )}
          </>
        )}
      </NavLink>
    ))}
  </nav>
);

const Logo = ({ collapsed }) => (
  <div className="flex items-center gap-2.5 px-6 py-7">
    <span className="h-3 w-3 shrink-0 rounded-full bg-cyan-neon shadow-glow-cyan animate-pulse-slow" />
    {!collapsed && (
      <span className="font-display text-xl font-semibold tracking-tight text-ink-primary">
        NOVA
      </span>
    )}
  </div>
);

const Sidebar = ({ collapsed, mobileOpen, onCloseMobile }) => {
  const { user } = useAuth();
  const items = NAV_ITEMS.filter((item) => !item.adminOnly || user?.role === "admin");

  return (
    <>
      <aside
        className={`relative hidden shrink-0 flex-col border-r border-surface-3 bg-surface/60 backdrop-blur-xl transition-[width] duration-300 md:flex ${
          collapsed ? "w-24" : "w-72"
        }`}
      >
        <div className="pointer-events-none absolute left-0 top-0 h-full w-px bg-gradient-to-b from-transparent via-cyan-neon/50 to-transparent" />
        <Logo collapsed={collapsed} />
        <NavList collapsed={collapsed} items={items} />
      </aside>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onCloseMobile}
              className="fixed inset-0 z-30 cursor-pointer bg-void/70 backdrop-blur-sm md:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-surface-3 bg-surface md:hidden"
            >
              <div className="flex items-center justify-between px-4">
                <Logo collapsed={false} />
                <button
                  onClick={onCloseMobile}
                  className="rounded-lg p-2 text-ink-muted hover:bg-surface-2 hover:text-ink-primary"
                  aria-label="Close menu"
                >
                  <X size={20} />
                </button>
              </div>
              <NavList collapsed={false} onNavigate={onCloseMobile} items={items} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
