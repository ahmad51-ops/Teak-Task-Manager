import { useEffect, useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import Button from "../ui/Button";
import { useProjects, useProject } from "../../hooks/useProjects";
import { useAuth } from "../../hooks/useAuth";
import { canManageWorkspace } from "../../utils/permissions";

// Create and edit hit genuinely different backend endpoints with
// different accepted fields (see taskValidator.js / taskService.js):
// createTask accepts project + assignee + details; updateTask only
// accepts title/description/priority/dueDate/tags. Assigning after
// creation is its own PATCH /:id/assign endpoint entirely. This form
// reflects that split rather than pretending it's one flat resource.
const TaskForm = ({ mode = "create", initialValues, lockedProjectId, onSubmit, isPending }) => {
  const { user } = useAuth();
  const canAssign = canManageWorkspace(user);
  const [form, setForm] = useState({
    title: initialValues?.title || "",
    description: initialValues?.description || "",
    priority: initialValues?.priority || "medium",
    dueDate: initialValues?.dueDate ? initialValues.dueDate.slice(0, 10) : "",
    project: lockedProjectId || "",
    assignee: "",
  });
  const [fieldError, setFieldError] = useState("");
  const [serverError, setServerError] = useState("");

  const { data: projectsData } = useProjects({ limit: 50 });
  const { data: selectedProject } = useProject(mode === "create" ? form.project : null);

  useEffect(() => {
    if (lockedProjectId) {
      setForm((f) => ({ ...f, project: lockedProjectId }));
    }
  }, [lockedProjectId]);

  const handleChange = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");

    if (form.title.trim().length < 3) {
      setFieldError("Title must be at least 3 characters");
      return;
    }
    if (mode === "create" && !form.project) {
      setFieldError("Choose a project for this task");
      return;
    }
    setFieldError("");

    const payload =
      mode === "create"
        ? {
            title: form.title,
            description: form.description || undefined,
            priority: form.priority,
            dueDate: form.dueDate || undefined,
            project: form.project,
            assignee: form.assignee || undefined,
          }
        : {
            title: form.title,
            description: form.description,
            priority: form.priority,
            dueDate: form.dueDate || undefined,
          };

    try {
      await onSubmit(payload);
    } catch (err) {
      setServerError(err.response?.data?.message || "Something went wrong. Try again.");
    }
  };

  const inputClass =
    "w-full rounded-lg border border-surface-3 bg-surface px-4 py-2.5 text-[15px] text-ink-primary placeholder:text-ink-faint focus:border-cyan-neon/50 focus:outline-none focus:ring-1 focus:ring-cyan-neon/30";

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {serverError && (
        <div className="flex items-start gap-2.5 rounded-lg border border-rose-neon/30 bg-rose-neon/10 px-4 py-3 text-sm text-rose-neon">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      <div>
        <label className="mb-1.5 block text-[15px] font-medium text-ink-muted">Title</label>
        <input
          value={form.title}
          onChange={handleChange("title")}
          placeholder="Set up CI pipeline"
          className={inputClass}
        />
        {fieldError && <p className="mt-1.5 text-xs text-rose-neon">{fieldError}</p>}
      </div>

      <div>
        <label className="mb-1.5 block text-[15px] font-medium text-ink-muted">Description</label>
        <textarea
          rows={3}
          value={form.description}
          onChange={handleChange("description")}
          placeholder="What needs to happen here?"
          className={`${inputClass} resize-none`}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-[15px] font-medium text-ink-muted">Priority</label>
          <select value={form.priority} onChange={handleChange("priority")} className={inputClass}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-[15px] font-medium text-ink-muted">Due date</label>
          <input
            type="date"
            value={form.dueDate}
            onChange={handleChange("dueDate")}
            className={inputClass}
          />
        </div>
      </div>

      {mode === "create" && (
        <>
          <div>
            <label className="mb-1.5 block text-[15px] font-medium text-ink-muted">Project</label>
            <select
              value={form.project}
              onChange={handleChange("project")}
              disabled={Boolean(lockedProjectId)}
              className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-60`}
            >
              <option value="">Select a project...</option>
              {projectsData?.projects.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Only admin/manager can set an assignee at all — mirrors the
              restriction on PATCH /:id/assign and the same check
              server-side in taskService.createTask. */}
          {canAssign && (
            <div>
              <label className="mb-1.5 block text-[15px] font-medium text-ink-muted">
                Assignee <span className="text-ink-faint">(optional)</span>
              </label>
              <select
                value={form.assignee}
                onChange={handleChange("assignee")}
                disabled={!form.project}
                className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-60`}
              >
                <option value="">Unassigned</option>
                {selectedProject?.members.map(({ user: member }) => (
                  <option key={member._id} value={member._id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </>
      )}

      <Button type="submit" className="w-full py-2.5" disabled={isPending}>
        {isPending ? <Loader2 size={16} className="animate-spin" /> : null}
        {mode === "create" ? "Create task" : "Save changes"}
      </Button>
    </form>
  );
};

export default TaskForm;
