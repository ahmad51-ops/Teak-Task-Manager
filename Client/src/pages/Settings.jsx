import { useEffect, useState } from "react";
import { Info } from "lucide-react";
import Card from "../components/ui/Card";

const STORAGE_KEY = "nova:preferences";

const Toggle = ({ checked, onChange }) => (
  <button
    onClick={onChange}
    className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
      checked ? "bg-cyan-neon/80" : "bg-surface-3"
    }`}
    role="switch"
    aria-checked={checked}
  >
    <span
      className={`absolute top-0.5 h-5 w-5 rounded-full bg-void shadow transition-transform ${
        checked ? "translate-x-5" : "translate-x-0.5"
      }`}
    />
  </button>
);

const SETTINGS_SECTIONS = [
  {
    title: "Notifications",
    items: [
      { key: "taskAssigned", label: "Task assigned to me", default: true },
      { key: "comments", label: "New comments on my tasks", default: true },
      { key: "dueDates", label: "Due date reminders", default: false },
    ],
  },
  {
    title: "Appearance",
    items: [
      { key: "compactMode", label: "Compact task rows", default: false },
      { key: "reduceMotion", label: "Reduce interface motion", default: false },
    ],
  },
];

const DEFAULT_VALUES = Object.fromEntries(
  SETTINGS_SECTIONS.flatMap((s) => s.items.map((i) => [i.key, i.default]))
);

// There's no backend model for user preferences anywhere in this app's
// 9 backend phases — the User schema has no `preferences` field, and no
// endpoint was ever built for it. Rather than fake a save that silently
// does nothing, or a fake API call, these persist to localStorage
// instead: real persistence, honestly scoped to "this device only."
// A real cross-device version would need a `preferences` field added to
// the User model plus a PATCH endpoint — worth doing if this matters.
const Settings = () => {
  const [values, setValues] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? { ...DEFAULT_VALUES, ...JSON.parse(stored) } : DEFAULT_VALUES;
    } catch {
      return DEFAULT_VALUES;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
  }, [values]);

  const toggle = (key) => setValues((v) => ({ ...v, [key]: !v[key] }));

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <p className="mb-1 font-mono text-xs uppercase tracking-widest text-cyan-neon">
          Preferences
        </p>
        <h1 className="font-display text-2xl font-semibold text-ink-primary md:text-3xl">
          Settings
        </h1>
      </div>

      <div className="flex items-start gap-2.5 rounded-lg border border-surface-3 bg-surface-2 px-4 py-3 text-sm text-ink-muted">
        <Info size={16} className="mt-0.5 shrink-0 text-ink-faint" />
        <span>
          These preferences save to this browser only — there's no account-level
          preferences endpoint yet, so they won't follow you to another device.
        </span>
      </div>

      {SETTINGS_SECTIONS.map((section) => (
        <Card key={section.title} className="space-y-1">
          <h2 className="mb-3 font-display text-base font-semibold text-ink-primary">
            {section.title}
          </h2>
          {section.items.map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between border-t border-surface-3 py-3 first:border-t-0"
            >
              <span className="text-sm text-ink-primary">{item.label}</span>
              <Toggle checked={values[item.key]} onChange={() => toggle(item.key)} />
            </div>
          ))}
        </Card>
      ))}
    </div>
  );
};

export default Settings;
