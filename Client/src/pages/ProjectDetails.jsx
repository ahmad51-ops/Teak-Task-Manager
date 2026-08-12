import { useCallback, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Pencil,
  Archive,
  ArchiveRestore,
  Trash2,
  UserPlus,
  Loader2,
} from "lucide-react";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import ProjectForm from "../components/project/ProjectForm";
import InviteMemberForm from "../components/project/InviteMemberForm";
import MemberList from "../components/project/MemberList";
import { useAuth } from "../hooks/useAuth";
import { useProject } from "../hooks/useProjects";
import { useTasks } from "../hooks/useTasks";
import { useSocketRoom } from "../hooks/useSocketRoom";
import {
  useUpdateProject,
  useDeleteProject,
  useSetArchiveStatus,
  useInviteMember,
  useRemoveMember,
} from "../hooks/useProjectMutations";
import { canManageWorkspace } from "../utils/permissions";

const STATUS_TONE = { todo: "neutral", "in-progress": "cyan", review: "amber", done: "violet" };

const ProjectDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [editOpen, setEditOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [removingId, setRemovingId] = useState(null);

  const { data: project, isLoading, isError, error, refetch } = useProject(id);
  const { data: taskData, isLoading: tasksLoading } = useTasks({ project: id, limit: 6 });

  const updateProject = useUpdateProject(id);
  const deleteProject = useDeleteProject();
  const archiveStatus = useSetArchiveStatus(id);
  const inviteMember = useInviteMember(id);
  const removeMember = useRemoveMember(id);

  // useCallback here — passed to MemberList, which maps this handler
  // onto every member row. Also must sit above the isLoading/isError
  // early returns below, along with every other hook in this component.
  const handleRemoveMember = useCallback(
    async (userId, memberName) => {
      // Matches the confirm-before-destructive-action pattern already
      // used for deleting tasks and projects — removing someone from a
      // project is just as easy to misclick and just as annoying to undo.
      if (
        !window.confirm(
          `Remove ${memberName || "this member"} from the project? They'll lose access to its tasks.`
        )
      ) {
        return;
      }
      setRemovingId(userId);
      try {
        await removeMember.mutateAsync(userId);
      } finally {
        setRemovingId(null);
      }
    },
    [removeMember]
  );

  const queryClient = useQueryClient();
  const handleLiveUpdate = useCallback(
    (payload) => {
      queryClient.invalidateQueries({ queryKey: ["projects", id] });
      // task:* events don't carry enough info to target one exact query
      // key (list queries are keyed by their full filter params), so
      // this invalidates the whole "tasks" branch — slightly broader
      // than strictly necessary, but correct and simple.
      if (payload?.taskId) {
        queryClient.invalidateQueries({ queryKey: ["tasks"] });
      }
    },
    [queryClient, id]
  );

  useSocketRoom({
    joinEvent: "project:join",
    leaveEvent: "project:leave",
    roomId: id,
    events: ["project:updated", "task:created", "task:updated", "task:deleted"],
    onEvent: handleLiveUpdate,
  });

  // Hooks must run unconditionally on every render — this has to sit
  // ABOVE the isLoading/isError early returns below, not after them
  // (see the identical fix + explanation in TaskDetails.jsx).
  const { canManage, canDelete, canInvite } = useMemo(() => {
    if (!project) return { canManage: false, canDelete: false, canInvite: false };
    const isOwner = project.owner._id === user?._id;
    const membership = project.members.find((m) => m.user._id === user?._id);
    const isProjectAdmin = membership?.role === "admin";
    return {
      canManage: user?.role === "admin" || isOwner || isProjectAdmin,
      canDelete: user?.role === "admin" || isOwner,
      // Inviting is gated on global role alone (admin/manager), not
      // project ownership/admin status — see canManageWorkspace.
      canInvite: canManageWorkspace(user),
    };
  }, [project, user]);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="animate-spin text-cyan-neon" size={28} />
      </div>
    );
  }

  if (isError || !project) {
    return (
      <div className="flex items-center justify-between gap-4 rounded-lg border border-rose-neon/30 bg-rose-neon/10 px-4 py-3.5 text-sm text-rose-neon">
        <span>
          Couldn't load this project — {error?.response?.data?.message || "it may not exist, or you may not have access."}
        </span>
        {error && (
          <button
            onClick={() => refetch()}
            className="shrink-0 rounded-lg border border-rose-neon/30 px-2.5 py-1 text-xs font-medium hover:bg-rose-neon/10"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  const handleEdit = async (payload) => {
    await updateProject.mutateAsync(payload);
    setEditOpen(false);
  };

  const handleInvite = async (payload) => {
    await inviteMember.mutateAsync(payload);
    // The invited person is now a member, so they must drop out of the
    // "invitable" list — and the modal has done its job.
    queryClient.invalidateQueries({ queryKey: ["users", "invitable", id] });
    setInviteOpen(false);
  };

  const handleArchiveToggle = () => {
    archiveStatus.mutate(project.status !== "archived");
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${project.name}"? This can't be undone.`)) return;
    await deleteProject.mutateAsync(project._id);
    navigate("/projects", { replace: true });
  };

  return (
    <div className="space-y-6">
      <Link
        to="/projects"
        className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink-primary"
      >
        <ArrowLeft size={15} /> Back to projects
      </Link>

      <Card className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-2.5">
              <h1 className="font-display text-xl font-semibold break-words text-ink-primary md:text-2xl">
                {project.name}
              </h1>
              <Badge tone={project.status === "active" ? "cyan" : "neutral"}>
                {project.status}
              </Badge>
            </div>
            {project.description && (
              <p className="max-w-2xl break-words text-[15px] text-ink-muted">{project.description}</p>
            )}
          </div>

          {canManage && (
            <div className="flex shrink-0 flex-wrap gap-2">
              <Button variant="secondary" onClick={() => setEditOpen(true)}>
                <Pencil size={15} /> Edit
              </Button>
              <Button
                variant="secondary"
                onClick={handleArchiveToggle}
                disabled={archiveStatus.isPending}
              >
                {archiveStatus.isPending ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : project.status === "archived" ? (
                  <ArchiveRestore size={15} />
                ) : (
                  <Archive size={15} />
                )}
                {project.status === "archived" ? "Restore" : "Archive"}
              </Button>
              {canDelete && (
                <Button variant="danger" onClick={handleDelete} disabled={deleteProject.isPending}>
                  {deleteProject.isPending ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <Trash2 size={15} />
                  )}
                  Delete
                </Button>
              )}
            </div>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Tasks */}
        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-ink-primary">Tasks</h2>
            <Link
              to={`/tasks?project=${project._id}`}
              className="text-xs font-medium text-cyan-neon hover:underline"
            >
              View all
            </Link>
          </div>

          {tasksLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-5 w-full animate-pulse rounded bg-surface-3" />
              ))}
            </div>
          ) : taskData?.tasks.length === 0 ? (
            <p className="py-6 text-center text-sm text-ink-muted">
              No tasks in this project yet.
            </p>
          ) : (
            <ul className="divide-y divide-surface-3">
              {taskData.tasks.map((task) => (
                <li key={task._id} className="flex items-center justify-between gap-4 py-3">
                  <p className="truncate text-sm font-medium text-ink-primary">{task.title}</p>
                  <Badge tone={STATUS_TONE[task.status]} className="shrink-0 capitalize">
                    {task.status}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Members */}
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-ink-primary">Members</h2>
            {canInvite && (
              <button
                onClick={() => setInviteOpen(true)}
                className="flex items-center gap-1.5 text-xs font-medium text-cyan-neon hover:underline"
              >
                <UserPlus size={13} /> Invite
              </button>
            )}
          </div>
          <MemberList
            members={project.members}
            ownerId={project.owner._id}
            canManage={canManage}
            onRemove={handleRemoveMember}
            removingId={removingId}
          />
        </Card>
      </div>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit project">
        <ProjectForm
          initialValues={project}
          onSubmit={handleEdit}
          isPending={updateProject.isPending}
          submitLabel="Save changes"
        />
      </Modal>

      <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} title="Invite a member">
        <InviteMemberForm
          projectId={id}
          onSubmit={handleInvite}
          isPending={inviteMember.isPending}
        />
      </Modal>
    </div>
  );
};

export default ProjectDetails;
