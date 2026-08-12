import { Link } from "react-router-dom";
import { FolderKanban, ListChecks, CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import { useAuth } from "../hooks/useAuth";
import { useDashboardStats } from "../hooks/useDashboardStats";

const STAT_CONFIG = [
  { key: "totalProjects", label: "Total projects", icon: FolderKanban, tone: "cyan", to: "/projects" },
  { key: "assignedTasks", label: "Assigned tasks", icon: ListChecks, tone: "violet", to: "/tasks" },
  { key: "completedTasks", label: "Completed tasks", icon: CheckCircle2, tone: "amber", to: "/tasks" },
  { key: "overdueTasks", label: "Overdue tasks", icon: AlertTriangle, tone: "rose", to: "/tasks" },
];

const TONE_CLASSES = {
  cyan: "border-cyan-neon/30 bg-cyan-neon/10 text-cyan-neon",
  violet: "border-violet-neon/30 bg-violet-neon/10 text-violet-neon",
  amber: "border-amber-neon/30 bg-amber-neon/10 text-amber-neon",
  rose: "border-rose-neon/30 bg-rose-neon/10 text-rose-neon",
};

const StatCardSkeleton = () => (
  <Card className="p-5">
    <div className="mb-4 h-9 w-9 animate-pulse rounded-lg bg-surface-3" />
    <div className="mb-2 h-7 w-12 animate-pulse rounded bg-surface-3" />
    <div className="h-3 w-24 animate-pulse rounded bg-surface-3" />
  </Card>
);

const Dashboard = () => {
  const { user } = useAuth();
  const { stats, recentTasks, isLoading, isError, error, refetchAll } = useDashboardStats();

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="mb-1 font-mono text-xs uppercase tracking-widest text-cyan-neon">
            Mission control
          </p>
          <h1 className="font-display text-2xl font-semibold text-ink-primary md:text-3xl">
            Welcome back, {user?.name?.split(" ")[0] ?? "there"}
          </h1>
          <p className="mt-1 text-[15px] text-ink-muted">
            Here's what's moving across your projects today.
          </p>
        </div>
        <button
          onClick={refetchAll}
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-surface-3 px-3 py-2 text-xs text-ink-muted transition-colors hover:border-cyan-neon/40 hover:text-ink-primary"
        >
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {isError && (
        <div className="rounded-lg border border-rose-neon/30 bg-rose-neon/10 px-4 py-3.5 text-sm text-rose-neon">
          Couldn't load your dashboard data —{" "}
          {error?.response?.data?.message || error?.message || "please try again"}.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading
          ? STAT_CONFIG.map((s) => <StatCardSkeleton key={s.key} />)
          : STAT_CONFIG.map(({ key, label, icon: Icon, tone, to }) => (
              <Link key={key} to={to}>
                <Card className="h-full p-5 transition-colors hover:border-cyan-neon/30">
                  <div className="mb-3">
                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-lg border ${TONE_CLASSES[tone]}`}
                    >
                      <Icon size={16} />
                    </span>
                  </div>
                  <p className="font-display text-2xl font-semibold text-ink-primary">
                    {stats[key]}
                  </p>
                  <p className="text-xs text-ink-muted">{label}</p>
                </Card>
              </Link>
            ))}
      </div>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-ink-primary">Recent tasks</h2>
          <Badge tone="cyan">live</Badge>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-5 w-full animate-pulse rounded bg-surface-3" />
            ))}
          </div>
        ) : recentTasks.length === 0 ? (
          <p className="py-6 text-center text-sm text-ink-muted">
            No tasks yet — create one to see it here.
          </p>
        ) : (
          <ul className="divide-y divide-surface-3">
            {recentTasks.map((task) => (
              <li key={task._id} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink-primary">{task.title}</p>
                  <p className="text-xs text-ink-muted">{task.project?.name}</p>
                </div>
                <span className="shrink-0 font-mono text-xs capitalize text-ink-faint">
                  {task.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
};

export default Dashboard;
