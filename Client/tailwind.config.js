/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        void: "#0B0E14",
        surface: "#131720",
        "surface-2": "#1B212D",
        "surface-3": "#232B39",
        cyan: {
          neon: "#4CF3E8",
        },
        violet: {
          neon: "#A66CFF",
        },
        amber: {
          neon: "#FFB84C",
        },
        rose: {
          neon: "#FF6B9D",
        },
        ink: {
          primary: "#E8EDF4",
          muted: "#8891A3",
          faint: "#4B5568",
        },
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      boxShadow: {
        "glow-cyan": "0 0 20px rgba(76, 243, 232, 0.35)",
        "glow-violet": "0 0 20px rgba(166, 108, 255, 0.35)",
        "glow-cyan-sm": "0 0 10px rgba(76, 243, 232, 0.25)",
      },
      backgroundImage: {
        "grid-pattern":
          "linear-gradient(rgba(76, 243, 232, 0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(76, 243, 232, 0.04) 1px, transparent 1px)",
        "aurora-gradient":
          "radial-gradient(circle at 20% 20%, rgba(166, 108, 255, 0.15), transparent 40%), radial-gradient(circle at 80% 60%, rgba(76, 243, 232, 0.12), transparent 40%)",
      },
      backgroundSize: {
        grid: "32px 32px",
      },
      animation: {
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        drift: "drift 18s ease-in-out infinite",
        "drift-reverse": "drift-reverse 22s ease-in-out infinite",
      },
      keyframes: {
        drift: {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "50%": { transform: "translate(40px, -30px) scale(1.1)" },
        },
        "drift-reverse": {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "50%": { transform: "translate(-50px, 40px) scale(1.05)" },
        },
      },
    },
  },
  plugins: [],
};
