import { Search, X } from "lucide-react";

const SearchInput = ({ value, onChange, placeholder = "Search..." }) => (
  <div className="relative w-full min-w-0 sm:max-w-xs sm:flex-1">
    <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-lg border border-surface-3 bg-surface py-2 pl-9 pr-8 text-sm text-ink-primary placeholder:text-ink-faint focus:border-cyan-neon/50 focus:outline-none focus:ring-1 focus:ring-cyan-neon/30"
    />
    {value && (
      <button
        onClick={() => onChange("")}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink-primary"
        aria-label="Clear search"
      >
        <X size={14} />
      </button>
    )}
  </div>
);

export default SearchInput;
