import { useRef, useState } from "react";
import { Camera, Loader2, AlertCircle, CheckCircle2, ShieldCheck } from "lucide-react";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Avatar from "../components/ui/Avatar";
import PasswordInput from "../components/ui/PasswordInput";
import { useAuth } from "../hooks/useAuth";
import { useUpdateProfile, useUploadAvatar, useChangePassword } from "../hooks/useProfileMutations";
import { required, getPasswordStrengthError } from "../utils/validators";

const inputClass =
  "w-full rounded-lg border border-surface-3 bg-surface px-3.5 py-2.5 text-sm text-ink-primary focus:border-cyan-neon/50 focus:outline-none focus:ring-1 focus:ring-cyan-neon/30";

const Profile = () => {
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  // --- Name edit ---
  const [name, setName] = useState(user?.name || "");
  const [nameSaved, setNameSaved] = useState(false);
  const updateProfile = useUpdateProfile();

  const handleSaveName = async (e) => {
    e.preventDefault();
    setNameSaved(false);
    if (!required(name)) return;
    await updateProfile.mutateAsync({ name });
    setNameSaved(true);
    setTimeout(() => setNameSaved(false), 2500);
  };

  // --- Avatar upload ---
  const uploadAvatar = useUploadAvatar();
  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) uploadAvatar.mutate(file);
    e.target.value = "";
  };

  // --- Change password ---
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [pwFieldError, setPwFieldError] = useState("");
  const [pwSaved, setPwSaved] = useState(false);
  const changePassword = useChangePassword();

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwSaved(false);
    const strengthError = getPasswordStrengthError(pwForm.newPassword);
    if (strengthError) {
      setPwFieldError(strengthError);
      return;
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwFieldError("Passwords don't match");
      return;
    }
    setPwFieldError("");
    await changePassword.mutateAsync(pwForm);
    setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    setPwSaved(true);
    setTimeout(() => setPwSaved(false), 2500);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <p className="mb-1 font-mono text-xs uppercase tracking-widest text-violet-neon">
          Account
        </p>
        <h1 className="font-display text-2xl font-semibold text-ink-primary md:text-3xl">
          Profile
        </h1>
      </div>

      <Card className="flex items-center gap-5">
        <div className="relative">
          <Avatar user={user} size="xl" />
          {/* The whole badge is the upload trigger — bigger hit area
              than the old 24px button, and it reads as an affordance
              rather than decoration. */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadAvatar.isPending}
            className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full border border-surface-3 bg-surface-2 text-ink-muted transition-colors hover:border-cyan-neon/40 hover:text-cyan-neon disabled:opacity-50"
            aria-label="Change profile photo"
            title="Change profile photo"
          >
            {uploadAvatar.isPending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Camera size={16} />
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleAvatarChange}
            className="hidden"
          />
        </div>
        <div>
          <p className="font-display text-xl font-semibold text-ink-primary">{user?.name}</p>
          <p className="text-[15px] text-ink-muted">{user?.email}</p>
          <div className="mt-2 flex items-center gap-2">
            <Badge tone="violet" className="capitalize">
              {user?.role}
            </Badge>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadAvatar.isPending}
              className="text-[13px] font-medium text-cyan-neon hover:underline disabled:opacity-50"
            >
              {uploadAvatar.isPending ? "Uploading..." : "Change photo"}
            </button>
          </div>
        </div>
      </Card>

      {uploadAvatar.isError && (
        <div className="flex items-start gap-2.5 rounded-lg border border-rose-neon/30 bg-rose-neon/10 px-4 py-3 text-sm text-rose-neon">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{uploadAvatar.error?.response?.data?.message || "Couldn't upload that image."}</span>
        </div>
      )}

      <Card>
        <form onSubmit={handleSaveName} className="space-y-4">
          <h2 className="font-display text-base font-semibold text-ink-primary">
            Personal information
          </h2>

          {updateProfile.isError && (
            <div className="flex items-start gap-2.5 rounded-lg border border-rose-neon/30 bg-rose-neon/10 px-4 py-3 text-sm text-rose-neon">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{updateProfile.error?.response?.data?.message || "Couldn't save your name."}</span>
            </div>
          )}
          {nameSaved && (
            <div className="flex items-center gap-2.5 rounded-lg border border-cyan-neon/30 bg-cyan-neon/10 px-4 py-3 text-sm text-cyan-neon">
              <CheckCircle2 size={16} />
              <span>Saved.</span>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-muted">Full name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-muted">Email</label>
            <input
              type="email"
              defaultValue={user?.email}
              disabled
              className="w-full cursor-not-allowed rounded-lg border border-surface-3 bg-surface-2 px-3.5 py-2.5 text-sm text-ink-faint"
            />
            <p className="mt-1.5 text-xs text-ink-faint">Email can't be changed from here.</p>
          </div>
          <Button type="submit" variant="secondary" disabled={updateProfile.isPending}>
            {updateProfile.isPending ? <Loader2 size={15} className="animate-spin" /> : null}
            Save changes
          </Button>
        </form>
      </Card>

      {/* Google accounts have no password stored (see User model's
          conditional password requirement), so a change-password form
          could never succeed for them — explain instead of failing. */}
      {user?.isGoogleAccount ? (
        <Card className="flex items-start gap-3">
          <ShieldCheck size={20} className="mt-0.5 shrink-0 text-cyan-neon" />
          <div>
            <h2 className="font-display text-base font-semibold text-ink-primary">
              Signed in with Google
            </h2>
            <p className="mt-1 text-[15px] text-ink-muted">
              This account uses Google to sign in, so there's no password to
              change here. Manage it from your Google account settings.
            </p>
          </div>
        </Card>
      ) : (
      <Card>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <h2 className="font-display text-base font-semibold text-ink-primary">
            Change password
          </h2>

          {changePassword.isError && (
            <div className="flex items-start gap-2.5 rounded-lg border border-rose-neon/30 bg-rose-neon/10 px-4 py-3 text-sm text-rose-neon">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>
                {changePassword.error?.response?.data?.message || "Couldn't change your password."}
              </span>
            </div>
          )}
          {pwFieldError && (
            <div className="flex items-start gap-2.5 rounded-lg border border-rose-neon/30 bg-rose-neon/10 px-4 py-3 text-sm text-rose-neon">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{pwFieldError}</span>
            </div>
          )}
          {pwSaved && (
            <div className="flex items-center gap-2.5 rounded-lg border border-cyan-neon/30 bg-cyan-neon/10 px-4 py-3 text-sm text-cyan-neon">
              <CheckCircle2 size={16} />
              <span>Password updated.</span>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-muted">
              Current password
            </label>
            <PasswordInput
              value={pwForm.currentPassword}
              onChange={(e) => setPwForm((f) => ({ ...f, currentPassword: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-muted">New password</label>
            <PasswordInput
              placeholder="At least 8 characters, including a letter"
              value={pwForm.newPassword}
              onChange={(e) => setPwForm((f) => ({ ...f, newPassword: e.target.value }))}
              className={inputClass}
            />
            <p className="mt-1.5 text-xs text-ink-faint">
              At least 8 characters, with at least one letter and one number
            </p>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-muted">
              Confirm new password
            </label>
            <PasswordInput
              value={pwForm.confirmPassword}
              onChange={(e) => setPwForm((f) => ({ ...f, confirmPassword: e.target.value }))}
              className={inputClass}
            />
          </div>
          <Button type="submit" variant="secondary" disabled={changePassword.isPending}>
            {changePassword.isPending ? <Loader2 size={15} className="animate-spin" /> : null}
            Update password
          </Button>
        </form>
      </Card>
      )}
    </div>
  );
};

export default Profile;
