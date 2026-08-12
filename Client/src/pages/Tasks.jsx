import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { Plus, ListChecks, X as XIcon } from "lucide-react";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import SearchInput from "../components/ui/SearchInput";
import Pagination from "../components/ui/Pagination";
import TaskForm from "../components/task/TaskForm";
import { useTasks } from "../hooks/useTasks";
import { useProject } from "../hooks/useProjects";
import { useCreateTask } from "../hooks/useTaskMutations";
import { useDebounce } from "../hooks/useDebounce";
import { usePagination } from "../hooks/usePagination";
import { useSocketRoom } from "../hooks/useSocketRoom";

const STATUS_TABS = [
  { label: "All", value: undefined },
  { label: "Todo", value: "todo" },
  { label: "In progress", value: "in-progress" },
  { label: "Review", value: "review" },
  { label: "Done", value: "done" },
];

const PRIORITY_OPTIONS = [
  { label: "All priorities", value: "" },
  { label: "Low", value: "low" },
  { label: "Medium", value: "medium" },
  { label: "High", value: "high" },
  { label: "Urgent", value: "urgent" },
];

const SORT_OPTIONS = [
  { label: "Newest first", sortBy: "createdAt", order: "desc" },
  { label: "Oldest first", sortBy: "createdAt", order: "asc" },
  { label: "Due soonest", sortBy: "dueDate", order: "asc" },
  { label: "Title A–Z", sortBy: "title", order: "asc" },
];

const PRIORITY_TONE = { low: "neutral", medium: "cyan", high: "amber", urgent: "rose" };
const STATUS_TONE = { todo: "neutral", "in-progress": "cyan", review: "amber", done: "violet" };
const PAGE_SIZE = 10;

const Tasks = () => {
  const [searchParams] = useSearchParams();
  const projectFilter = searchParams.get("project") || undefined;

  const [activeStatus, setActiveStatus] = useState(undefined);
  const [priority, setPriority] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortIndex, setSortIndex] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const { page, setPage, resetPage, nextPage, prevPage } = usePagination();

  // Debounced so typing doesn't fire a request on every keystroke — only
  // once the user pauses for 400ms.
  const debouncedSearch = useDebounce(searchTerm, 400);
  const sort = SORT_OPTIONS[sortIndex];

  const { data, isLoading, isError, error } = useTasks({
    project: projectFilter,
    status: activeStatus,
    priority: priority || undefined,
    search: debouncedSearch || undefined,
    sortBy: sort.sortBy,
    order: sort.order,
    page,
    limit: PAGE_SIZE,
  });
  const { data: filteredProject } = useProject(projectFilter);
  const createTask = useCreateTask();

  // Live sync only makes sense when filtered to one project — an
  // unfiltered "all my tasks across every project" view has no single
  // room to join. That's an acceptable scope limit: the common case
  // (viewing one project's board, exactly the ProjectDetails "View all"
  // flow) stays live; the rare unfiltered view just needs a manual
  // refresh, same as before this phase.
  const queryClient = useQueryClient();
  const handleTaskEvent = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["tasks"] });
  }, [queryClient]);

  useSocketRoom({
    joinEvent: "project:join",
    leaveEvent: "project:leave",
    roomId: projectFilter,
    events: ["task:created", "task:updated", "task:deleted"],
    onEvent: handleTaskEvent,
  });

  // Any filter change should snap back to page 1 — staying on page 4 of
  // a now-empty filtered result is a common, confusing bug to leave in.
  const updateFilter = (setter) => (value) => {
    setter(value);
    resetPage();
  };

  const handleCreate = async (payload) => {
    await createTask.mutateAsync(payload);
    setCreateOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="mb-1 font-mono text-xs uppercase tracking-widest text-cyan-neon">Board</p>
          <h1 className="font-display text-2xl font-semibold text-ink-primary md:text-3xl">
            Tasks
          </h1>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus size={17} /> New task
        </Button>
      </div>

      {projectFilter && (
        <div className="flex items-center gap-2 rounded-lg border border-cyan-neon/30 bg-cyan-neon/10 px-3.5 py-2 text-sm text-cyan-neon">
          <span>
            Filtered to project: <strong>{filteredProject?.name ?? "..."}</strong>
          </span>
          <Link to="/tasks" className="ml-auto rounded p-0.5 hover:bg-cyan-neon/10">
            <XIcon size={14} />
          </Link>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 md:gap-3">
        <SearchInput
          value={searchTerm}
          onChange={updateFilter(setSearchTerm)}
          placeholder="Search tasks..."
        />
        <select
          value={priority}
          onChange={(e) => updateFilter(setPriority)(e.target.value)}
          className="min-w-0 flex-1 rounded-lg border border-surface-3 bg-surface px-3 py-2 text-sm text-ink-primary focus:border-cyan-neon/50 focus:outline-none focus:ring-1 focus:ring-cyan-neon/30 sm:flex-none"
        >
          {PRIORITY_OPTIONS.map((opt) => (
            <option key={opt.label} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <select
          value={sortIndex}
          onChange={(e) => updateFilter(setSortIndex)(Number(e.target.value))}
          className="min-w-0 flex-1 rounded-lg border border-surface-3 bg-surface px-3 py-2 text-sm text-ink-primary focus:border-cyan-neon/50 focus:outline-none focus:ring-1 focus:ring-cyan-neon/30 sm:flex-none"
        >
          {SORT_OPTIONS.map((opt, i) => (
            <option key={opt.label} value={i}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.label}
            onClick={() => updateFilter(setActiveStatus)(tab.value)}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
              activeStatus === tab.value
                ? "border-cyan-neon/40 bg-cyan-neon/10 text-cyan-neon"
                : "border-surface-3 text-ink-muted hover:text-ink-primary"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isError && (
        <div className="rounded-lg border border-rose-neon/30 bg-rose-neon/10 px-4 py-3.5 text-sm text-rose-neon">
          Couldn't load tasks — {error?.response?.data?.message || error?.message}.
        </div>
      )}

      <Card className="divide-y divide-surface-3 p-0">
        {isLoading ? (
          <div className="space-y-0">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="px-6 py-4">
                <div className="h-4 w-1/3 animate-pulse rounded bg-surface-3" />
              </div>
            ))}
          </div>
        ) : data?.tasks.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-14 text-center">
            <ListChecks size={28} className="text-ink-faint" />
            <p className="text-ink-muted">No tasks match this view.</p>
          </div>
        ) : (
          data.tasks.map((task) => (
            <Link
              key={task._id}
              to={`/tasks/${task._id}`}
              className="flex flex-col gap-2 px-4 py-4 transition-colors hover:bg-surface-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4 md:px-6"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink-primary">{task.title}</p>
                <p className="text-xs text-ink-muted">{task.project?.name}</p>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <Badge tone={PRIORITY_TONE[task.priority]}>{task.priority}</Badge>
                <Badge tone={STATUS_TONE[task.status]} className="capitalize">
                  {task.status}
                </Badge>
              </div>
            </Link>
          ))
        )}
      </Card>

      {data?.pagination && (
        <Pagination
          page={data.pagination.page}
          totalPages={data.pagination.totalPages}
          total={data.pagination.total}
          onPrev={prevPage}
          onNext={() => nextPage(data.pagination.totalPages)}
        />
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New task">
        <TaskForm
          mode="create"
          lockedProjectId={projectFilter}
          onSubmit={handleCreate}
          isPending={createTask.isPending}
        />
      </Modal>
    </div>
  );
};

export default Tasks;
