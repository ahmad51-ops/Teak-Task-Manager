export const isValidEmail = (value) => /^\S+@\S+\.\S+$/.test((value || "").trim());

export const minLength = (value, length) => (value || "").length >= length;

export const required = (value) => Boolean((value || "").trim());

// Mirrors the backend's shared passwordRule (validators/authValidator.js),
// which BOTH registration and change-password now use: at least 8
// characters and at least one letter. Returns the specific reason rather
// than a boolean, so the UI can name the missing requirement instead of
// showing a generic "invalid password."
export const getPasswordStrengthError = (value) => {
  const v = value || "";
  if (v.length < 8) return "Password must be at least 8 characters";
  if (!/[A-Za-z]/.test(v)) return "Password must contain at least one letter";
  return null;
};
