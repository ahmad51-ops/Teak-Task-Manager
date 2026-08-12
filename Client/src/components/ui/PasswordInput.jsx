import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

// Drop-in replacement for <input type="password" className={...} />across
// Login/Register/Profile — same props, just adds the show/hide toggle so
// each form doesn't reimplement this itself.
const PasswordInput = ({ className = "", ...props }) => {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input type={visible ? "text" : "password"} className={`${className} pr-11`} {...props} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink-muted"
        aria-label={visible ? "Hide password" : "Show password"}
      >
        {visible ? <EyeOff size={17} /> : <Eye size={17} />}
      </button>
    </div>
  );
};

export default PasswordInput;
