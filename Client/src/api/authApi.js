import api, { setAccessToken } from "./axios";

// Two possible outcomes, both surfaced to the caller: verification
// enabled -> { pendingVerification: true, email }, no session yet.
// Verification disabled -> a real logged-in user, same as before.
export const registerUser = async ({ name, email, password }) => {
  const { data } = await api.post("/auth/register", { name, email, password });
  if (data.data.pendingVerification) {
    return data.data;
  }
  setAccessToken(data.data.accessToken);
  return data.data.user;
};

export const verifyEmail = async ({ email, code }) => {
  const { data } = await api.post("/auth/verify-email", { email, code });
  setAccessToken(data.data.accessToken);
  return data.data.user;
};

export const resendVerificationCode = async (email) => {
  await api.post("/auth/resend-verification", { email });
};

export const loginUser = async ({ email, password }) => {
  const { data } = await api.post("/auth/login", { email, password });
  setAccessToken(data.data.accessToken);
  return data.data.user;
};

export const logoutUser = async () => {
  await api.post("/auth/logout");
  setAccessToken(null);
};

export const fetchCurrentUser = async () => {
  const { data } = await api.get("/auth/me");
  return data.data;
};

// Called once on app boot. The access token lives only in memory and is
// lost on every page reload — this uses the httpOnly refreshToken cookie
// (still valid for up to 7 days per Phase 4) to silently restore the
// session without asking the user to log in again. If there's no valid
// cookie, this just rejects and the app falls back to showing Login.
export const restoreSession = async () => {
  const { data } = await api.post("/auth/refresh-token");
  setAccessToken(data.data.accessToken);
  return fetchCurrentUser();
};

export const loginWithGoogle = async (credential) => {
  const { data } = await api.post("/auth/google", { credential });
  setAccessToken(data.data.accessToken);
  return data.data.user;
};

// Tells the login page whether the server has Google configured, so it
// can hide the button entirely rather than render one that would fail.
export const getAuthConfig = async () => {
  const { data } = await api.get("/auth/config");
  return data.data;
};
