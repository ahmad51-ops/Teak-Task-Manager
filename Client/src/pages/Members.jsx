import { useState } from "react";
import { Loader2, Users, ShieldCheck, Ban, RotateCcw } from "lucide-react";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import SearchInput from "../components/ui/SearchInput";
import Pagination from "../components/ui/Pagination";
import Avatar from "../components/ui/Avatar";
import { useAuth } from "../hooks/useAuth";
import { useDebounce } from "../hooks/useDebounce";
import { usePagination } from "../hooks/usePagination";
import { useUserDirectory, useUpdateUserRole, useSetUserActive } from "../hooks/useUsers";

const ROLE_TONE = { admin: "violet", manager: "cyan", member: "neutral" };
const PAGE_SIZE = 20;

// "3m ago" style relative time, falling back to an absolute date once
// something's old enough that "42d ago" stops being useful.
const formatLastSeen = (dateStr) => {
  if (!dateStr) return "never";
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "moments ago";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const Members = () => {
  const { user: currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const { page, resetPage, nextPage, prevPage } = usePagination();

  const debouncedSearch = useDebounce(searchTerm, 400);

  const { data, isLoading, isError, error } = useUserDirectory({
    search: debouncedSearch || undefined,
    page,
    limit: PAGE_SIZE,
  });

  // Searching snaps back to page 1 — same as Tasks and Projects.
  // Without this you can end up stranded on page 3 of a result set
  // that now only has one page.
  const handleSearchChange = (value) => {
    setSearchTerm(value);
    resetPage();
  };
  const updateRole = useUpdateUserRole();
  const setActive = useSetUserActive();

  const onlineCount = data?.users.filter((u) => u.isOnline).length ?? 0;

  const handleRoleChange = (userId, role) => {
    updateRole.mutate({ userId, role });
  };

  const handleToggleActive = (user) => {
    const action = user.isActive ? "deactivate" : "reactivate";
    if (!window.confirm(`Are you sure you want to ${action} ${user.name}'s account?`)) return;
    setActive.mutate({ userId: user._id, active: !user.isActive });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="mb-1 font-mono text-xs uppercase tracking-widest text-violet-neon">
            Administration
          </p>
          <h1 className="font-display text-2xl font-semibold text-ink-primary md:text-3xl">
            Team members
          </h1>
          <p className="mt-1 text-[15px] text-ink-muted">
            Everyone with an account, and who's online right now.
          </p>
        </div>
        <Badge tone="cyan" className="text-[13px]">
          <span className="h-2 w-2 rounded-full bg-cyan-neon shadow-glow-cyan" />
          {onlineCount} online
        </Badge>
      </div>

      <SearchInput
        value={searchTerm}
        onChange={handleSearchChange}
        placeholder="Search by name or email..."
      />

      {isError && (
        <div className="rounded-lg border border-rose-neon/30 bg-rose-neon/10 px-4 py-3.5 text-sm text-rose-neon">
          Couldn't load members — {error?.response?.data?.message || error?.message}.
        </div>
      )}

      <Card className="p-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="animate-spin text-cyan-neon" size={28} />
          </div>
        ) : data?.users.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Users size={30} className="text-ink-faint" />
            <p className="text-ink-muted">No members match this search.</p>
          </div>
        ) : (
          <ul className="divide-y divide-surface-3">
            {data.users.map((member) => (
              <li
                key={member._id}
                className="flex flex-wrap items-center justify-between gap-4 px-4 py-4 md:px-6"
              >
                <div className="flex min-w-0 items-center gap-3.5">
                  {/* Presence dot is driven by socket connect/disconnect,
                      not a stored flag that could go stale on a restart. */}
                  <Avatar user={member} size="md" showPresence isOnline={member.isOnline} />
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-medium text-ink-primary">
                      {member.name}
                      {member._id === currentUser?._id && (
                        <span className="ml-2 text-[13px] text-ink-faint">(you)</span>
                      )}
                    </p>
                    <p className="truncate text-[13px] text-ink-muted">{member.email}</p>
                    <p className="mt-0.5 font-mono text-xs text-ink-faint">
                      {member.isOnline ? (
                        <span className="text-cyan-neon">● Active now</span>
                      ) : (
                        <>Last seen {formatLastSeen(member.lastSeen)}</>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex w-full shrink-0 flex-wrap items-center gap-2 sm:w-auto">
                  {!member.isActive && <Badge tone="rose">deactivated</Badge>}

                  {/* An admin changing their own role could lock them
                      out of this very page — so that control is disabled
                      for yourself. */}
                  {member._id === currentUser?._id ? (
                    <Badge tone={ROLE_TONE[member.role]} className="capitalize">
                      <ShieldCheck size={13} /> {member.role}
                    </Badge>
                  ) : (
                    <select
                      value={member.role}
                      onChange={(e) => handleRoleChange(member._id, e.target.value)}
                      disabled={updateRole.isPending}
                      className="rounded-lg border border-surface-3 bg-surface px-3 py-1.5 text-[13px] capitalize text-ink-primary focus:border-cyan-neon/50 focus:outline-none"
                    >
                      <option value="member">member</option>
                      <option value="manager">manager</option>
                      <option value="admin">admin</option>
                    </select>
                  )}

                  {member._id !== currentUser?._id && (
                    <button
                      onClick={() => handleToggleActive(member)}
                      disabled={setActive.isPending}
                      className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[13px] transition-colors disabled:opacity-50 ${
                        member.isActive
                          ? "border-surface-3 text-ink-muted hover:border-rose-neon/40 hover:text-rose-neon"
                          : "border-cyan-neon/30 text-cyan-neon hover:bg-cyan-neon/10"
                      }`}
                    >
                      {member.isActive ? (
                        <>
                          <Ban size={13} /> Deactivate
                        </>
                      ) : (
                        <>
                          <RotateCcw size={13} /> Reactivate
                        </>
                      )}
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
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
    </div>
  );
};

export default Members;
