import { useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getProjects } from "../api/projectApi";
import { getTasks } from "../api/taskApi";
import { useAuth } from "./useAuth";

// Composes existing list endpoints rather than a dedicated stats
// endpoint. Total projects / assigned / completed are exact — they come
// straight from pagination.total, not from counting fetched rows.
// Overdue is the one approximation here: the backend has no date-range
// filter (Phase 7 didn't need one), so this counts overdue tasks out of
// whatever this page of assigned tasks returns. Fine at current scale;
// a real `GET /tasks/stats` aggregation endpoint would be the fix if a
// user ever has more assigned tasks than TASK_FETCH_LIMIT — worth
// flagging for Phase 18 (Optimization).
const TASK_FETCH_LIMIT = 100;

export const useDashboardStats = () => {
  const { user } = useAuth();
  const userId = user?._id;

  const projectsQuery = useQuery({
    queryKey: ["dashboard", "projects", "count"],
    queryFn: () => getProjects({ limit: 1 }),
    enabled: Boolean(userId),
  });

  const assignedQuery = useQuery({
    queryKey: ["dashboard", "tasks", "assigned", userId],
    queryFn: () => getTasks({ assignee: userId, limit: TASK_FETCH_LIMIT }),
    enabled: Boolean(userId),
  });

  const completedCountQuery = useQuery({
    queryKey: ["dashboard", "tasks", "completed-count", userId],
    queryFn: () => getTasks({ assignee: userId, status: "done", limit: 1 }),
    enabled: Boolean(userId),
  });

  const recentTasksQuery = useQuery({
    queryKey: ["dashboard", "tasks", "recent"],
    queryFn: () => getTasks({ limit: 5 }),
    enabled: Boolean(userId),
  });

  // Without useMemo, this filter (plus a Date parse per task) reruns on
  // every render of whatever component calls this hook — including
  // renders triggered by something else entirely, like the Refresh
  // button's own pending state. Only actually needs to rerun when the
  // assigned-tasks data itself changes.
  const overdueTasks = useMemo(() => {
    const now = Date.now();
    return (
      assignedQuery.data?.tasks.filter(
        (t) => t.status !== "done" && t.dueDate && new Date(t.dueDate).getTime() < now
      ).length ?? 0
    );
  }, [assignedQuery.data]);

  const isLoading =
    projectsQuery.isLoading ||
    assignedQuery.isLoading ||
    completedCountQuery.isLoading ||
    recentTasksQuery.isLoading;

  const isError =
    projectsQuery.isError ||
    assignedQuery.isError ||
    completedCountQuery.isError ||
    recentTasksQuery.isError;

  const error =
    projectsQuery.error || assignedQuery.error || completedCountQuery.error || recentTasksQuery.error;

  const refetchAll = useCallback(() => {
    projectsQuery.refetch();
    assignedQuery.refetch();
    completedCountQuery.refetch();
    recentTasksQuery.refetch();
  }, [projectsQuery, assignedQuery, completedCountQuery, recentTasksQuery]);

  return {
    isLoading,
    isError,
    error,
    stats: {
      totalProjects: projectsQuery.data?.pagination.total ?? 0,
      assignedTasks: assignedQuery.data?.pagination.total ?? 0,
      completedTasks: completedCountQuery.data?.pagination.total ?? 0,
      overdueTasks,
    },
    recentTasks: recentTasksQuery.data?.tasks ?? [],
    refetchAll,
  };
};
