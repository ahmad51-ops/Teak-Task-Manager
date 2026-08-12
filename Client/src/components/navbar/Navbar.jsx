import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, Search, Bell, ChevronDown, LogOut, User as UserIcon } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import Avatar from "../ui/Avatar";
import { useNotifications } from "../../hooks/useNotifications";

const timeAgo = (dateStr) => {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
};

const Navbar = ({ onToggleSidebar, onOpenMobileSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const { notifications, unseenCount, markAllSeen } = useNotifications();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const toggleNotifications = () => {
    setNotifOpen((v) => !v);
    if (!notifOpen) markAllSeen();
  };

  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-surface-3 bg-void/80 px-4 py-3 backdrop-blur-xl md:px-8">
      <button
        onClick={onOpenMobileSidebar}
        className="rounded-lg p-2 text-ink-muted hover:bg-surface-2 hover:text-ink-primary md:hidden"
        aria-label="Open menu"
      >
        <Menu size={23} />
      </button>
      <button
        onClick={onToggleSidebar}
        className="hidden rounded-lg p-2 text-ink-muted hover:bg-surface-2 hover:text-ink-primary md:block"
        aria-label="Toggle sidebar"
      >
        <Menu size={23} />
      </button>

      <div className="relative max-w-md flex-1">
        <Search
          size={18}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
        />
        <input
          type="text"
          placeholder="Search tasks, projects..."
          className="w-full rounded-lg border border-surface-3 bg-surface py-2 pl-9 pr-3 text-sm text-ink-primary placeholder:text-ink-faint transition-colors focus:border-cyan-neon/50 focus:outline-none focus:ring-1 focus:ring-cyan-neon/30"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <div className="relative">
          <button
            onClick={toggleNotifications}
            className="relative rounded-lg p-2 text-ink-muted hover:bg-surface-2 hover:text-ink-primary"
            aria-label="Notifications"
          >
            <Bell size={22} />
            {/* Genuinely real now — driven by live socket events, not a
                fake always-on dot (see Phase 15's fix for the old one).
                Still only reflects notifications received since this
                page loaded — there's no GET /notifications for history. */}
            {unseenCount > 0 && (
              <span className="absolute right-1 top-1 flex h-2 w-2 items-center justify-center rounded-full bg-rose-neon shadow-glow-cyan-sm" />
            )}
          </button>

          <AnimatePresence>
            {notifOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setNotifOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="glass-panel absolute right-0 z-20 mt-2 w-72 rounded-xl p-2 shadow-2xl"
                >
                  <p className="px-2 py-1.5 text-xs font-medium uppercase tracking-wide text-ink-faint">
                    Live notifications
                  </p>
                  {notifications.length === 0 ? (
                    <p className="px-2 py-4 text-center text-sm text-ink-muted">
                      Nothing yet — new activity will appear here live.
                    </p>
                  ) : (
                    <ul className="max-h-80 space-y-0.5 overflow-y-auto">
                      {notifications.map((n) => (
                        <li
                          key={n._id}
                          className="rounded-lg px-2.5 py-2 text-sm text-ink-primary hover:bg-surface-2"
                        >
                          <p>{n.message}</p>
                          <p className="mt-0.5 font-mono text-xs text-ink-faint">
                            {timeAgo(n.createdAt)}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-lg border border-transparent px-2 py-1.5 hover:border-surface-3 hover:bg-surface-2"
          >
            <Avatar user={user} size="sm" />
            <div className="hidden text-left md:block">
              <p className="text-sm font-medium leading-tight text-ink-primary">{user?.name}</p>
              <p className="text-xs capitalize leading-tight text-ink-muted">{user?.role}</p>
            </div>
            <ChevronDown size={17} className="text-ink-muted" />
          </button>

          <AnimatePresence>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="glass-panel absolute right-0 z-20 mt-2 w-48 rounded-xl p-1.5 shadow-2xl"
                >
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      navigate("/profile");
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-muted hover:bg-surface-2 hover:text-ink-primary"
                  >
                    <UserIcon size={17} /> Profile
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-rose-neon hover:bg-rose-neon/10"
                  >
                    <LogOut size={17} /> Log out
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
