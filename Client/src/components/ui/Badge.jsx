const TONES = {
  cyan: "bg-cyan-neon/10 text-cyan-neon border-cyan-neon/30",
  violet: "bg-violet-neon/10 text-violet-neon border-violet-neon/30",
  amber: "bg-amber-neon/10 text-amber-neon border-amber-neon/30",
  rose: "bg-rose-neon/10 text-rose-neon border-rose-neon/30",
  neutral: "bg-surface-2 text-ink-muted border-surface-3",
};

const Badge = ({ tone = "neutral", className = "", children }) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-xs ${TONES[tone]} ${className}`}
  >
    {children}
  </span>
);

export default Badge;
