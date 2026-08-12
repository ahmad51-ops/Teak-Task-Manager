import { useState } from "react";
import { Loader2, AlertCircle, UserPlus, Users, Check } from "lucide-react";
import Button from "../ui/Button";
import Avatar from "../ui/Avatar";
import { useInvitableUsers } from "../../hooks/useUsers";

// Replaces the old "type an email and hope that account exists" flow —
// this only ever lists real, active users who aren't already members,
// so a valid selection can't 404 or 409 the way a typed email could.
const InviteMemberForm = ({ projectId, onSubmit, isPending }) => {
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState("member");
  const [fieldError, setFieldError] = useState("");
  const [serverError, setServerError] = useState("");

  const { data: users, isLoading, isError } = useInvitableUsers(projectId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");

    if (!userId) {
      setFieldError("Select someone to invite");
      return;
    }
    setFieldError("");

    try {
      await onSubmit({ userId, role });
      setUserId("");
      setRole("member");
    } catch (err) {
      setServerError(err.response?.data?.message || "Couldn't invite this person. Try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="animate-spin text-cyan-neon" size={24} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-start gap-2.5 rounded-lg border border-rose-neon/30 bg-rose-neon/10 px-4 py-3 text-sm text-rose-neon">
        <AlertCircle size={17} className="mt-0.5 shrink-0" />
        <span>Couldn't load the list of people to invite.</span>
      </div>
    );
  }

  if (!users || users.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <Users size={30} className="text-ink-faint" />
        <p className="text-[15px] text-ink-muted">
          Everyone with an account is already a member of this project.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {serverError && (
        <div className="flex items-start gap-2.5 rounded-lg border border-rose-neon/30 bg-rose-neon/10 px-4 py-3 text-sm text-rose-neon">
          <AlertCircle size={17} className="mt-0.5 shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      <div>
        <label className="mb-2 block text-[15px] font-medium text-ink-muted">
          Who would you like to add?
        </label>
        {/* A native <select> can't render images, so this is a radio
            list styled as selectable rows — same single-choice
            semantics and keyboard behaviour, but avatars can show. */}
        <ul
          role="radiogroup"
          className={`max-h-64 space-y-1 overflow-y-auto rounded-lg border p-1.5 ${
            fieldError ? "border-rose-neon/50" : "border-surface-3"
          }`}
        >
          {users.map((u) => {
            const selected = userId === u._id;
            return (
              <li key={u._id}>
                <button
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setUserId(u._id)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                    selected
                      ? "border border-cyan-neon/40 bg-cyan-neon/10"
                      : "border border-transparent hover:bg-surface-2"
                  }`}
                >
                  <Avatar user={u} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-medium text-ink-primary">
                      {u.name}
                    </span>
                    <span className="block truncate text-[13px] text-ink-muted">{u.email}</span>
                  </span>
                  {selected && (
                    <Check size={18} className="shrink-0 text-cyan-neon" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
        {fieldError && <p className="mt-1.5 text-xs text-rose-neon">{fieldError}</p>}
        <p className="mt-1.5 text-[13px] text-ink-faint">
          {users.length} {users.length === 1 ? "person" : "people"} available to add
        </p>
      </div>

      <div>
        <label className="mb-2 block text-[15px] font-medium text-ink-muted" htmlFor="invite-role">
          Project role
        </label>
        <select
          id="invite-role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full rounded-lg border border-surface-3 bg-surface px-4 py-3 text-[15px] text-ink-primary focus:border-cyan-neon/50 focus:outline-none focus:ring-1 focus:ring-cyan-neon/30"
        >
          <option value="member">Member — can view and work on tasks</option>
          <option value="admin">Admin — can also edit the project and invite others</option>
        </select>
      </div>

      <Button type="submit" className="w-full py-3 text-[15px]" disabled={isPending}>
        {isPending ? <Loader2 size={17} className="animate-spin" /> : <UserPlus size={17} />}
        Add to project
      </Button>
    </form>
  );
};

export default InviteMemberForm;
