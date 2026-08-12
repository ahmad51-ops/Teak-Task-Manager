const VARIANTS = {
  primary:
    "bg-gradient-to-r from-violet-neon to-cyan-neon text-void font-semibold hover:shadow-glow-cyan",
  secondary:
    "bg-surface-2 border border-surface-3 text-ink-primary hover:border-cyan-neon/40",
  ghost: "text-ink-muted hover:text-ink-primary hover:bg-surface-2",
  danger: "bg-rose-neon/10 text-rose-neon border border-rose-neon/30 hover:bg-rose-neon/20",
};

const Button = ({ variant = "primary", className = "", children, ...props }) => (
  <button
    className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${className}`}
    {...props}
  >
    {children}
  </button>
);

export default Button;
