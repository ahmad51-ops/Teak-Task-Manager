import { useCallback, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LogIn, Loader2, AlertCircle } from "lucide-react";
import Button from "../components/ui/Button";
import { useAuth } from "../hooks/useAuth";
import GoogleSignInButton from "../components/auth/GoogleSignInButton";
import { isValidEmail } from "../utils/validators";

const Login = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const validate = () => {
    const errors = {};
    if (!isValidEmail(form.email)) errors.email = "Enter a valid email address";
    if (!form.password) errors.password = "Password is required";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await login(form);
      const redirectTo = location.state?.from?.pathname || "/dashboard";
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setServerError(
        err.response?.data?.message || "Something went wrong signing you in. Try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // useCallback so GoogleSignInButton's effect (which depends on this)
  // doesn't re-run and re-render the Google button on every keystroke
  // in the email/password fields.
  const handleGoogleCredential = useCallback(
    async (credential) => {
      setServerError("");
      setIsSubmitting(true);
      try {
        await loginWithGoogle(credential);
        const redirectTo = location.state?.from?.pathname || "/dashboard";
        navigate(redirectTo, { replace: true });
      } catch (err) {
        setServerError(
          err.response?.data?.message || "Couldn't sign you in with Google. Try again."
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [loginWithGoogle, navigate, location]
  );

  return (
    <div>
      <div className="mb-8 text-center">
        <p className="mb-1.5 font-mono text-xs uppercase tracking-widest text-cyan-neon">
          Welcome back
        </p>
        <h1 className="font-display text-[28px] font-semibold text-ink-primary">
          Sign in to NOVA
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
            className={`w-full rounded-lg border bg-surface px-4 py-3 text-[15px] text-ink-primary placeholder:text-ink-faint focus:outline-none focus:ring-1 ${
              fieldErrors.email
                ? "border-rose-neon/50 focus:ring-rose-neon/30"
                : "border-surface-3 focus:border-cyan-neon/50 focus:ring-cyan-neon/30"
            }`}
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
            autoComplete="current-password"
            value={form.password}
            onChange={handleChange}
            placeholder="••••••••"
            className={`w-full rounded-lg border bg-surface px-4 py-3 text-[15px] text-ink-primary placeholder:text-ink-faint focus:outline-none focus:ring-1 ${
              fieldErrors.password
                ? "border-rose-neon/50 focus:ring-rose-neon/30"
                : "border-surface-3 focus:border-cyan-neon/50 focus:ring-cyan-neon/30"
            }`}
          />
          {fieldErrors.password && (
            <p className="mt-1.5 text-xs text-rose-neon">{fieldErrors.password}</p>
          )}
        </div>

        <Button type="submit" className="w-full py-3.5 text-[15px]" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 size={18} className="animate-spin" /> Signing in...
            </>
          ) : (
            <>
              <LogIn size={18} /> Sign in
            </>
          )}
        </Button>
      </form>

      <div className="mt-6">
        <GoogleSignInButton onCredential={handleGoogleCredential} onError={setServerError} />
      </div>

      <p className="mt-8 text-center text-[15px] text-ink-muted">
        New to NOVA?{" "}
        <Link to="/register" className="font-medium text-cyan-neon hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
};

export default Login;
