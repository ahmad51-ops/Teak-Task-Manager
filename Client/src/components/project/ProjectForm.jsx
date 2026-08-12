import { useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import Button from "../ui/Button";

const ProjectForm = ({ initialValues, onSubmit, isPending, submitLabel }) => {
  const [form, setForm] = useState({
    name: initialValues?.name || "",
    description: initialValues?.description || "",
  });
  const [fieldError, setFieldError] = useState("");
  const [serverError, setServerError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");

    if (form.name.trim().length < 3) {
      setFieldError("Project name must be at least 3 characters");
      return;
    }
    setFieldError("");

    try {
      await onSubmit(form);
    } catch (err) {
      setServerError(err.response?.data?.message || "Something went wrong. Try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {serverError && (
        <div className="flex items-start gap-2.5 rounded-lg border border-rose-neon/30 bg-rose-neon/10 px-4 py-3 text-sm text-rose-neon">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      <div>
        <label className="mb-2 block text-[15px] font-medium text-ink-muted" htmlFor="name">
          Project name
        </label>
        <input
          id="name"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="Website Revamp"
          className={`w-full rounded-lg border bg-surface px-4 py-2.5 text-[15px] text-ink-primary placeholder:text-ink-faint focus:outline-none focus:ring-1 ${
            fieldError
              ? "border-rose-neon/50 focus:ring-rose-neon/30"
              : "border-surface-3 focus:border-cyan-neon/50 focus:ring-cyan-neon/30"
          }`}
        />
        {fieldError && <p className="mt-1.5 text-xs text-rose-neon">{fieldError}</p>}
      </div>

      <div>
        <label className="mb-2 block text-[15px] font-medium text-ink-muted" htmlFor="description">
          Description
        </label>
        <textarea
          id="description"
          rows={3}
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          placeholder="What's this project about?"
          className="w-full resize-none rounded-lg border border-surface-3 bg-surface px-4 py-2.5 text-[15px] text-ink-primary placeholder:text-ink-faint focus:border-cyan-neon/50 focus:outline-none focus:ring-1 focus:ring-cyan-neon/30"
        />
      </div>

      <Button type="submit" className="w-full py-2.5" disabled={isPending}>
        {isPending ? <Loader2 size={16} className="animate-spin" /> : null}
        {submitLabel}
      </Button>
    </form>
  );
};

export default ProjectForm;
