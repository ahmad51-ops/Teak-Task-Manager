import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { MailCheck, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import Button from "../components/ui/Button";
import { useAuth } from "../hooks/useAuth";
import { resendVerificationCode } from "../api/authApi";
import { isValidEmail } from "../utils/validators";

// Reached right after Register.jsx when email verification is enabled
// server-side (registerUser returned { pendingVerification, email }
// instead of a session) — see AuthContext.register. location.state
// carries the email from that redirect, but doesn't survive a reload,
// so the field stays editable rather than locked, with an empty
// starting point if someone lands here directly.
const VerifyEmail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { verifyEmail } = useAuth();

  const [email, setEmail] = useState(location.state?.email || "");
  const [code, setCode] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendState, setResendState] = useState("idle"); // idle | sending | sent

  const validate = () => {
    const errors = {};
    if (!isValidEmail(email)) errors.email = "Enter a valid email address";
    if (!/^\d{6}$/.test(code)) errors.code = "Enter the 6-digit code from your email";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await verifyEmail({ email: email.trim().toLowerCase(), code });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setServerError(
        err.response?.data?.message || "Couldn't verify that code. Try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    setServerError("");
    if (!isValidEmail(email)) {
      setFieldErrors((f) => ({ ...f, email: "Enter a valid email address" }));
      return;
    }
    setResendState("sending");
    try {
      await resendVerificationCode(email.trim().toLowerCase());
      setResendState("sent");
    } catch (err) {
      setServerError(err.response?.data?.message || "Couldn't resend the code. Try again.");
      setResendState("idle");
    }
  };

  const inputClass = (hasError) =>
    `w-full rounded-lg border bg-surface px-4 py-3 text-[15px] text-ink-primary placeholder:text-ink-faint focus:outline-none focus:ring-1 ${
      hasError
        ? "border-rose-neon/50 focus:ring-rose-neon/30"
        : "border-surface-3 focus:border-cyan-neon/50 focus:ring-cyan-neon/30"
    }`;

  return (
    <div>
      <div className="mb-8 text-center">
        <MailCheck size={28} className="mx-auto mb-3 text-cyan-neon" />
        <p className="mb-1.5 font-mono text-xs uppercase tracking-widest text-cyan-neon">
          Almost there
        </p>
        <h1 className="font-display text-[28px] font-semibold text-ink-primary">
          Verify your email
        </h1>
        <p className="mt-2 text-[15px] text-ink-muted">
          We sent a 6-digit code to your inbox. Enter it below to finish creating your account.
        </p>
      </div>

      {serverError && (
        <div className="mb-6 flex items-start gap-2.5 rounded-lg border border-rose-neon/30 bg-rose-neon/10 px-4 py-3.5 text-sm text-rose-neon">
          <AlertCircle size={17} className="mt-0.5 shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      {resendState === "sent" && (
        <div className="mb-6 flex items-start gap-2.5 rounded-lg border border-cyan-neon/30 bg-cyan-neon/10 px-4 py-3.5 text-sm text-cyan-neon">
          <CheckCircle2 size={17} className="mt-0.5 shrink-0" />
          <span>A new code is on its way — check your inbox.</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <div>
          <label className="mb-2 block text-[15px] font-medium text-ink-muted" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            className={inputClass(fieldErrors.email)}
          />
          {fieldErrors.email && (
            <p className="mt-1.5 text-xs text-rose-neon">{fieldErrors.email}</p>
          )}
        </div>

        <div>
          <label className="mb-2 block text-[15px] font-medium text-ink-muted" htmlFor="code">
            Verification code
          </label>
          <input
            id="code"
            name="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="123456"
            className={`${inputClass(fieldErrors.code)} text-center font-mono text-lg tracking-[0.5em]`}
          />
          {fieldErrors.code && <p className="mt-1.5 text-xs text-rose-neon">{fieldErrors.code}</p>}
        </div>

        <Button type="submit" className="w-full py-3.5 text-[15px]" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 size={18} className="animate-spin" /> Verifying...
            </>
          ) : (
            "Verify email"
          )}
        </Button>
      </form>

      <p className="mt-6 text-center text-[15px] text-ink-muted">
        Didn't get a code?{" "}
        <button
          type="button"
          onClick={handleResend}
          disabled={resendState === "sending"}
          className="font-medium text-cyan-neon hover:underline disabled:opacity-60"
        >
          {resendState === "sending" ? "Sending..." : "Resend it"}
        </button>
      </p>

      <p className="mt-3 text-center text-[15px] text-ink-muted">
        Wrong email?{" "}
        <Link to="/register" className="font-medium text-cyan-neon hover:underline">
          Start over
        </Link>
      </p>
    </div>
  );
};

export default VerifyEmail;
