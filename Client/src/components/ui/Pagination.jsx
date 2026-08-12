import { ChevronLeft, ChevronRight } from "lucide-react";

const Pagination = ({ page, totalPages, total, onPrev, onNext }) => {
  if (!totalPages || totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between gap-4 pt-2">
      <p className="text-xs text-ink-faint">
        Page {page} of {totalPages} · {total} total
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={onPrev}
          disabled={page <= 1}
          className="flex items-center gap-1 rounded-lg border border-surface-3 px-3 py-1.5 text-xs text-ink-muted hover:border-cyan-neon/40 hover:text-ink-primary disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-surface-3 disabled:hover:text-ink-muted"
        >
          <ChevronLeft size={13} /> Prev
        </button>
        <button
          onClick={onNext}
          disabled={page >= totalPages}
          className="flex items-center gap-1 rounded-lg border border-surface-3 px-3 py-1.5 text-xs text-ink-muted hover:border-cyan-neon/40 hover:text-ink-primary disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-surface-3 disabled:hover:text-ink-muted"
        >
          Next <ChevronRight size={13} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
