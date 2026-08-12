import { useCallback, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserPlus, Loader2, AlertCircle } from "lucide-react";
import Button from "../components/ui/Button";
import { useAuth } from "../hooks/useAuth";
import GoogleSignInButton from "../components/auth/GoogleSignInButton";
import { isValidEmail, required, getPasswordStrengthError } from "../utils/validators";

const Register = () => {
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const validate = () => {
    const errors = {};
    if (!required(form.name) || form.name.trim().length < 2) {
      errors.name = "Name must be at least 2 characters";
    }
    if (!isValidEmail(form.email)) errors.email = "Enter a valid email address";
    // Same shared rule the backend enforces and the change-password
    // form uses — one definition, so the two can't drift apart.
    const passwordError = getPasswordStrengthError(form.password);
    if (passwordError) errors.password = passwordError;
    if (form.confirmPassword !== form.password) {
      errors.confirmPassword = "Passwords don't match";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const result = await register({ name: form.name, email: form.email, password: form.password });
      if (result?.pendingVerification) {
        navigate("/verify-email", { state: { email: result.email }, replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    } catch (err) {
      setServerError(
        err.response?.data?.message || "Something went wrong creating your account. Try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Google sign-in doubles as sign-up — a first-time Google user gets
  // an account created server-side (authService.loginWithGoogle), so
  // the same button works on both pages.
  const handleGoogleCredential = useCallback(
    async (credential) => {
      setServerError("");
      setIsSubmitting(true);
      try {
        await loginWithGoogle(credential);
        navigate("/dashboard", { replace: true });
      } catch (err) {
        setServerError(
          err.response?.data?.message || "Couldn't sign you up with Google. Try again."
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [loginWithGoogle, navigate]
  );

  const inputClass = (hasError) =>
    `w-full rounded-lg border bg-surface px-4 py-3 text-[15px] text-ink-primary placeholder:text-ink-faint focus:outline-none focus:ring-1 ${
      hasError
        ? "border-rose-neon/50 focus:ring-rose-neon/30"
        : "border-surface-3 focus:border-cyan-neon/50 focus:ring-cyan-neon/30"
    }`;

  return (
    <div>
      <div className="mb-8 text-center">
        <p className="mb-1.5 font-mono text-xs uppercase tracking-widest text-violet-neon">
          Get started
        </p>
        <h1 className="font-display text-[28px] font-semibold text-ink-primary">
          Create your account
        </h1>
      </div>

      {serverError && (
        <div className="mb-6 flex items-start gap-2.5 rounded-lg border border-rose-neon/30 bg-rose-neon/10 px-4 py-3.5 text-sm text-rose-neon">
          <AlertCircle size={17} className="mt-0.5 shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <div>
          <label className="mb-2 block text-[15px] font-medium text-ink-muted" htmlFor="name">
            Full name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Ayesha Khan"
            className={inputClass(fieldErrors.name)}
          />
          {fieldErrors.name && <p className="mt-1.5 text-xs text-rose-neon">{fieldErrors.name}</p>}
        </div>

        <div>
          <label className="mb-2 block text-[15px] font-medium text-ink-muted" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={handleChange}
            placeholder="you@company.com"
            className={inputClass(fieldErrors.email)}
          />
          {fieldErrors.email && (
            <p className="mt-1.5 text-xs text-rose-neon">{fieldErrors.email}</p>
          )}
        </div>

        <div>
          <label className="mb-2 block text-[15px] font-medium text-ink-muted" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            value={form.password}
            onChange={handleChange}
            placeholder="At least 8 characters, including a letter"
            className={inputClass(fieldErrors.password)}
          />
          {fieldErrors.password && (
            <p className="mt-1.5 text-xs text-rose-neon">{fieldErrors.password}</p>
          )}
        </div>

        <div>
          <label
            className="mb-2 block text-[15px] font-medium text-ink-muted"
            htmlFor="confirmPassword"
          >
            Confirm password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            value={form.confirmPassword}
            onChange={handleChange}
            placeholder="Re-enter your password"
            className={inputClass(fieldErrors.confirmPassword)}
          />
          {fieldErrors.confirmPassword && (
            <p className="mt-1.5 text-xs text-rose-neon">{fieldErrors.confirmPassword}</p>
          )}
        </div>

        <Button type="submit" className="w-full py-3.5 text-[15px]" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 size={18} className="animate-spin" /> Creating account...
            </>
          ) : (
            <>
              <UserPlus size={18} /> Create account
            </>
          )}
        </Button>
      </form>

      <div className="mt-6">
        <GoogleSignInButton onCredential={handleGoogleCredential} onError={setServerError} />
      </div>

      <p className="mt-8 text-center text-[15px] text-ink-muted">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-cyan-neon hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
};

export default Register;
