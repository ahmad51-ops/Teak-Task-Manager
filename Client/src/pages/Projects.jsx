import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Users, FolderKanban } from "lucide-react";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import SearchInput from "../components/ui/SearchInput";
import Pagination from "../components/ui/Pagination";
import ProjectForm from "../components/project/ProjectForm";
import { useProjects } from "../hooks/useProjects";
import { useCreateProject } from "../hooks/useProjectMutations";
import { useDebounce } from "../hooks/useDebounce";
import { usePagination } from "../hooks/usePagination";
import { useAuth } from "../hooks/useAuth";
import { canManageWorkspace } from "../utils/permissions";

const STATUS_TABS = [
  { label: "All", value: "" },
  { label: "Active", value: "active" },
  { label: "Archived", value: "archived" },
];

const SORT_OPTIONS = [
  { label: "Newest first", sortBy: "createdAt", order: "desc" },
  { label: "Oldest first", sortBy: "createdAt", order: "asc" },
  { label: "Name A–Z", sortBy: "name", order: "asc" },
];

const PAGE_SIZE = 9;

const ProjectCardSkeleton = () => (
  <Card className="space-y-4">
    <div className="h-5 w-2/3 animate-pulse rounded bg-surface-3" />
    <div className="h-1.5 w-full animate-pulse rounded-full bg-surface-3" />
    <div className="h-4 w-1/2 animate-pulse rounded bg-surface-3" />
  </Card>
);

const Projects = () => {
  const { user } = useAuth();
  const canCreate = canManageWorkspace(user);
  const [createOpen, setCreateOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [status, setStatus] = useState("");
  const [sortIndex, setSortIndex] = useState(0);
  const { page, resetPage, nextPage, prevPage } = usePagination();

  const debouncedSearch = useDebounce(searchTerm, 400);
  const sort = SORT_OPTIONS[sortIndex];

  const { data, isLoading, isError, error } = useProjects({
    search: debouncedSearch || undefined,
    status: status || undefined,
    sortBy: sort.sortBy,
    order: sort.order,
    page,
    limit: PAGE_SIZE,
  });
  const createProject = useCreateProject();

  const updateFilter = (setter) => (value) => {
    setter(value);
    resetPage();
  };

  const handleCreate = async (payload) => {
    await createProject.mutateAsync(payload);
    setCreateOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="mb-1 font-mono text-xs uppercase tracking-widest text-violet-neon">
            Workspace
          </p>
          <h1 className="font-display text-2xl font-semibold text-ink-primary md:text-3xl">
            Projects
          </h1>
        </div>
        {canCreate && (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus size={17} /> New project
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          value={searchTerm}
          onChange={updateFilter(setSearchTerm)}
          placeholder="Search projects..."
        />
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
            onClick={() => updateFilter(setStatus)(tab.value)}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
              status === tab.value
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
          Couldn't load projects — {error?.response?.data?.message || error?.message}.
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <ProjectCardSkeleton key={i} />
          ))}
        </div>
      ) : data?.projects.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 py-14 text-center">
          <FolderKanban size={28} className="text-ink-faint" />
          <p className="text-ink-muted">No projects match this view.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.projects.map((project) => (
            <Link key={project._id} to={`/projects/${project._id}`}>
              <Card className="flex h-full flex-col gap-4 transition-colors hover:border-cyan-neon/30">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-display text-lg font-semibold text-ink-primary">
                    {project.name}
                  </h3>
                  <Badge tone={project.status === "active" ? "cyan" : "neutral"}>
                    {project.status}
                  </Badge>
                </div>

                {project.description && (
                  <p className="line-clamp-2 break-words text-sm text-ink-muted">{project.description}</p>
                )}

                <div className="mt-auto flex items-center justify-between text-xs text-ink-muted">
                  <span className="flex items-center gap-1.5">
                    <Users size={13} /> {project.members?.length ?? 0} members
                  </span>
                  <span className="font-mono text-ink-faint">
                    {new Date(project.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {data?.pagination && (
        <Pagination
          page={data.pagination.page}
          totalPages={data.pagination.totalPages}
          total={data.pagination.total}
          onPrev={prevPage}
          onNext={() => nextPage(data.pagination.totalPages)}
        />
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New project">
        <ProjectForm
          onSubmit={handleCreate}
          isPending={createProject.isPending}
          submitLabel="Create project"
        />
      </Modal>
    </div>
  );
};

export default Projects;
