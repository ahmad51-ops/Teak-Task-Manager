import { useCallback, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Loader2,
  Clock,
  UserCheck,
  CalendarDays,
} from "lucide-react";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Avatar from "../components/ui/Avatar";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import TaskForm from "../components/task/TaskForm";
import CommentSection from "../components/task/CommentSection";
import AttachmentList from "../components/task/AttachmentList";
import { useAuth } from "../hooks/useAuth";
import { useTask } from "../hooks/useTasks";
import { useProject } from "../hooks/useProjects";
import { useSocketRoom } from "../hooks/useSocketRoom";
import {
  useUpdateTask,
  useDeleteTask,
  useAssignTask,
  useUpdateTaskStatus,
  useAddAttachment,
  useRemoveAttachment,
} from "../hooks/useTaskMutations";
import { isProjectManager, isProjectMember, canManageWorkspace } from "../utils/permissions";

const STATUS_TONE = { todo: "neutral", "in-progress": "cyan", review: "amber", done: "violet" };
const PRIORITY_TONE = { low: "neutral", medium: "cyan", high: "amber", urgent: "rose" };
const STATUS_OPTIONS = ["todo", "in-progress", "review", "done"];

const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

const TaskDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);
  const [removingAttachmentId, setRemovingAttachmentId] = useState(null);

  const { data: task, isLoading, isError, error, refetch } = useTask(id);
  // Task's own populate only gives project { name, status } (see taskService.js
  // POPULATE) — the full project doc (owner + members) is fetched separately,
  // needed for permission checks and the assignee dropdown.
  const { data: project } = useProject(task?.project?._id);

  const updateTask = useUpdateTask(id);
  const deleteTask = useDeleteTask();
  const assignTask = useAssignTask(id);
  const updateStatus = useUpdateTaskStatus(id);
  const addAttachment = useAddAttachment(id);
  const removeAttachment = useRemoveAttachment(id);

  // useCallback here specifically because these two are passed as props
  // to AttachmentList, which maps over an array to render one row per
  // attachment. Also must sit above the isLoading/isError early returns
  // below, along with every other hook in this component.
  const handleUpload = useCallback((file) => addAttachment.mutate(file), [addAttachment]);
  const handleRemoveAttachment = useCallback(
    async (attachmentId) => {
      setRemovingAttachmentId(attachmentId);
      try {
        await removeAttachment.mutateAsync(attachmentId);
      } finally {
        setRemovingAttachmentId(null);
      }
    },
    [removeAttachment]
  );

  const queryClient = useQueryClient();
  const handleLiveUpdate = useCallback(
    (event) => {
      queryClient.invalidateQueries({ queryKey: ["comments", id] });
      queryClient.invalidateQueries({ queryKey: ["tasks", "detail", id] });
    },
    [queryClient, id]
  );

  useSocketRoom({
    joinEvent: "task:join",
    leaveEvent: "task:leave",
    roomId: id,
    events: ["comment:added", "comment:updated", "comment:deleted", "task:updated"],
    onEvent: handleLiveUpdate,
  });

  // Hooks must run unconditionally on every render — this has to sit
  // ABOVE the isLoading/isError early returns below, not after them.
  // Calling useMemo only on renders where task has already loaded means
  // a different number of hooks fire between the "loading" render and
  // the "loaded" render, which breaks React's rules and throws.
  const { canEditDetails, canDelete, canChangeStatus, canAssign, canManageAttachments } =
    useMemo(() => {
      if (!task) {
        return {
          canEditDetails: false,
          canDelete: false,
          canChangeStatus: false,
          canAssign: false,
          canManageAttachments: false,
        };
      }
      // Edit/delete: the task's creator, or a global admin/manager —
      // matching taskService.js's updateTask/deleteTask exactly. Being
      // the assignee no longer grants edit rights on its own (a member
      // assigned a task an admin created shouldn't be able to change
      // it), and neither does project owner/admin status by itself.
      const isCreator = task.createdBy?._id === user?._id;
      const editDetails = isCreator || canManageWorkspace(user);
      const del = isCreator || canManageWorkspace(user);
      const changeStatus = isProjectMember(project, user);
      // Assigning (including claiming an unassigned task) is gated on
      // global role alone (admin/manager) — project ownership/admin
      // status no longer grants it, and self-claim is no longer a
      // special case. See canManageWorkspace.
      const assign = canManageWorkspace(user);
      const manageAttachments = isProjectManager(project, user);
      return {
        canEditDetails: editDetails,
        canDelete: del,
        canChangeStatus: changeStatus,
        canAssign: assign,
        canManageAttachments: manageAttachments,
      };
    }, [task, project, user]);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="animate-spin text-cyan-neon" size={28} />
      </div>
    );
  }

  if (isError || !task) {
    return (
      <div className="flex items-center justify-between gap-4 rounded-lg border border-rose-neon/30 bg-rose-neon/10 px-4 py-3.5 text-sm text-rose-neon">
        <span>
          Couldn't load this task — {error?.response?.data?.message || "it may not exist, or you may not have access."}
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
    await updateTask.mutateAsync(payload);
    setEditOpen(false);
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${task.title}"? This can't be undone.`)) return;
    await deleteTask.mutateAsync(task._id);
    navigate("/tasks", { replace: true });
  };

  return (
    <div className="space-y-6">
      <Link
        to={`/tasks${task.project?._id ? `?project=${task.project._id}` : ""}`}
        className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink-primary"
      >
        <ArrowLeft size={15} /> Back to tasks
      </Link>

      <Card className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="mb-1.5 font-mono text-xs uppercase tracking-widest text-cyan-neon">
              {task.project?.name}
            </p>
            <h1 className="font-display text-xl font-semibold break-words text-ink-primary md:text-2xl">{task.title}</h1>
            {task.description && (
              <p className="mt-2 max-w-2xl whitespace-pre-wrap break-words text-[15px] text-ink-muted">
                {task.description}
              </p>
            )}
          </div>

          {canEditDetails && (
            <div className="flex shrink-0 gap-2">
              <Button variant="secondary" onClick={() => setEditOpen(true)}>
                <Pencil size={15} /> Edit
              </Button>
              {canDelete && (
                <Button variant="danger" onClick={handleDelete} disabled={deleteTask.isPending}>
                  {deleteTask.isPending ? (
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

        <div className="flex flex-wrap items-center gap-3 border-t border-surface-3 pt-4">
          <Badge tone={PRIORITY_TONE[task.priority]} className="capitalize">
            {task.priority} priority
          </Badge>

          {/* Status — any project member can move this, matching the
              backend's low-friction kanban rule (Phase 7) */}
          <select
            value={task.status}
            onChange={(e) => updateStatus.mutate(e.target.value)}
            disabled={!canChangeStatus || updateStatus.isPending}
            className={`rounded-full border px-3 py-1 text-xs font-mono capitalize focus:outline-none disabled:cursor-not-allowed ${
              STATUS_TONE[task.status] === "violet"
                ? "border-violet-neon/30 bg-violet-neon/10 text-violet-neon"
                : STATUS_TONE[task.status] === "cyan"
                ? "border-cyan-neon/30 bg-cyan-neon/10 text-cyan-neon"
                : STATUS_TONE[task.status] === "amber"
                ? "border-amber-neon/30 bg-amber-neon/10 text-amber-neon"
                : "border-surface-3 bg-surface-2 text-ink-muted"
            }`}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {/* Assignee */}
          {canAssign ? (
            <select
              value={task.assignee?._id || ""}
              onChange={(e) => assignTask.mutate(e.target.value)}
              disabled={assignTask.isPending}
              className="rounded-full border border-surface-3 bg-surface-2 px-3 py-1 text-xs text-ink-muted focus:outline-none"
            >
              <option value="" disabled>
                Unassigned
              </option>
              {project?.members.map(({ user: member }) => (
                <option key={member._id} value={member._id}>
                  {member.name}
                </option>
              ))}
            </select>
          ) : (
            <span className="flex items-center gap-2 rounded-full border border-surface-3 bg-surface-2 py-1 pl-1 pr-3.5 text-[13px] text-ink-muted">
              {task.assignee ? (
                <>
                  <Avatar user={task.assignee} size="xs" />
                  {task.assignee.name}
                </>
              ) : (
                <>
                  <UserCheck size={14} className="ml-2" />
                  Unassigned
                </>
              )}
            </span>
          )}

          {task.dueDate && (
            <span className="flex items-center gap-1.5 rounded-full border border-surface-3 bg-surface-2 px-3 py-1 text-xs text-ink-muted">
              <CalendarDays size={12} /> Due {formatDate(task.dueDate)}
            </span>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h2 className="mb-4 font-display text-lg font-semibold text-ink-primary">Comments</h2>
          <CommentSection taskId={task._id} />
        </Card>

        <div className="space-y-6">
          <Card>
            <h2 className="mb-4 font-display text-lg font-semibold text-ink-primary">
              Attachments
            </h2>
            <AttachmentList
              attachments={task.attachments || []}
              canRemove={canManageAttachments}
              currentUserId={user?._id}
              onUpload={handleUpload}
              onRemove={handleRemoveAttachment}
              isUploading={addAttachment.isPending}
              removingId={removingAttachmentId}
            />
          </Card>

          {/* History — a lightweight, real-data substitute. The schema has
              no audit-log/activity model, so this surfaces the actual
              timestamps and facts the Task document holds rather than
              fabricating a fake event feed. A true change history would
              need a dedicated ActivityLog model — worth flagging for a
              later optimization pass if this app needs full audit trails. */}
          <Card>
            <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-ink-primary">
              <Clock size={16} className="text-ink-faint" /> History
            </h2>
            <ul className="space-y-3 text-sm">
              <li className="flex justify-between gap-4">
                <span className="text-ink-muted">Created by</span>
                <span className="text-right text-ink-primary">
                  {task.createdBy?.name} · {formatDate(task.createdAt)}
                </span>
              </li>
              <li className="flex justify-between gap-4">
                <span className="text-ink-muted">Last updated</span>
                <span className="text-ink-primary">{formatDate(task.updatedAt)}</span>
              </li>
              <li className="flex justify-between gap-4">
                <span className="text-ink-muted">Current status</span>
                <span className="capitalize text-ink-primary">{task.status}</span>
              </li>
            </ul>
          </Card>
        </div>
      </div>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit task">
        <TaskForm
          mode="edit"
          initialValues={task}
          onSubmit={handleEdit}
          isPending={updateTask.isPending}
        />
      </Modal>
    </div>
  );
};

export default TaskDetails;
