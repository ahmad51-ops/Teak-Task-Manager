import { X, Loader2 } from "lucide-react";
import Badge from "../ui/Badge";
import Avatar from "../ui/Avatar";

const ROLE_TONE = { owner: "violet", admin: "cyan", member: "neutral" };

const MemberList = ({ members, ownerId, canManage, onRemove, removingId }) => (
  <ul className="divide-y divide-surface-3">
    {members.map(({ user, role }) => (
      <li key={user._id} className="flex items-center justify-between gap-3 py-3.5">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar user={user} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-[15px] font-medium text-ink-primary">{user.name}</p>
            <p className="truncate text-[13px] text-ink-muted">{user.email}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Badge tone={ROLE_TONE[role]} className="capitalize">
            {role}
          </Badge>
          {canManage && user._id !== ownerId && (
            <button
              // Passes the name up so the confirm dialog can say who's
              // being removed, rather than a vague "this member".
              onClick={() => onRemove(user._id, user.name)}
              disabled={removingId === user._id}
              className="rounded-lg p-2 text-ink-faint hover:bg-rose-neon/10 hover:text-rose-neon disabled:opacity-50"
              aria-label={`Remove ${user.name}`}
            >
              {removingId === user._id ? (
                <Loader2 size={17} className="animate-spin" />
              ) : (
                <X size={17} />
              )}
            </button>
          )}
        </div>
      </li>
    ))}
  </ul>
);

export default MemberList;
