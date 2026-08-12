import { useState } from "react";
import { Send, Pencil, Trash2, Loader2 } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import Avatar from "../ui/Avatar";
import { useComments, useCreateComment, useUpdateComment, useDeleteComment } from "../../hooks/useComments";

const timeAgo = (dateStr) => {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const CommentSection = ({ taskId }) => {
  const { user } = useAuth();
  const { data, isLoading } = useComments(taskId);
  const createComment = useCreateComment(taskId);
  const updateComment = useUpdateComment(taskId);
  const deleteComment = useDeleteComment(taskId);

  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState("");

  const handlePost = async (e) => {
    e.preventDefault();
    if (!draft.trim()) return;
    await createComment.mutateAsync(draft.trim());
    setDraft("");
  };

  const startEdit = (comment) => {
    setEditingId(comment._id);
    setEditDraft(comment.content);
  };

  const saveEdit = async (commentId) => {
    if (!editDraft.trim()) return;
    await updateComment.mutateAsync({ commentId, content: editDraft.trim() });
    setEditingId(null);
  };

  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-12 w-full animate-pulse rounded-lg bg-surface-3" />
          ))}
        </div>
      ) : data?.comments.length === 0 ? (
        <p className="py-4 text-center text-sm text-ink-muted">
          No comments yet — start the discussion.
        </p>
      ) : (
        <ul className="space-y-4">
          {data?.comments.map((comment) => {
            const isOwn = comment.author._id === user?._id;
            const isEditing = editingId === comment._id;
            return (
              <li key={comment._id} className="flex gap-3">
                <Avatar user={comment.author} size="xs" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-ink-primary">
                      {comment.author.name}
                    </span>
                    <span className="font-mono text-xs text-ink-faint">
                      {timeAgo(comment.createdAt)}
                    </span>
                  </div>

                  {isEditing ? (
                    <div className="mt-1.5 space-y-2">
                      <textarea
                        value={editDraft}
                        onChange={(e) => setEditDraft(e.target.value)}
                        rows={2}
                        className="w-full resize-none rounded-lg border border-cyan-neon/40 bg-surface px-3 py-2 text-sm text-ink-primary focus:outline-none focus:ring-1 focus:ring-cyan-neon/30"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => saveEdit(comment._id)}
                          disabled={updateComment.isPending}
                          className="text-xs font-medium text-cyan-neon hover:underline"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-xs text-ink-muted hover:text-ink-primary"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-1 whitespace-pre-wrap break-words text-sm text-ink-muted">
                      {comment.content}
                    </p>
                  )}
                </div>

                {isOwn && !isEditing && (
                  <div className="flex shrink-0 items-start gap-1">
                    <button
                      onClick={() => startEdit(comment)}
                      className="rounded p-1 text-ink-faint hover:bg-surface-2 hover:text-ink-primary"
                      aria-label="Edit comment"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => deleteComment.mutate(comment._id)}
                      disabled={deleteComment.isPending}
                      className="rounded p-1 text-ink-faint hover:bg-rose-neon/10 hover:text-rose-neon"
                      aria-label="Delete comment"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <form onSubmit={handlePost} className="flex gap-2 border-t border-surface-3 pt-4">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add a comment..."
          className="flex-1 rounded-lg border border-surface-3 bg-surface px-3.5 py-2.5 text-sm text-ink-primary placeholder:text-ink-faint focus:border-cyan-neon/50 focus:outline-none focus:ring-1 focus:ring-cyan-neon/30"
        />
        <button
          type="submit"
          disabled={createComment.isPending || !draft.trim()}
          className="flex items-center justify-center rounded-lg bg-gradient-to-r from-violet-neon to-cyan-neon px-3.5 text-void disabled:opacity-50"
          aria-label="Post comment"
        >
          {createComment.isPending ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Send size={16} />
          )}
        </button>
      </form>
    </div>
  );
};

export default CommentSection;
