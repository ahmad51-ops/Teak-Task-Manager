import { createContext, useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import * as authApi from "../api/authApi";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  // True only during the initial "is there an existing session?" check
  // on app load — PrivateRoute uses this to avoid flashing a redirect
  // to /login before we've even asked the backend.
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    authApi
      .restoreSession()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setIsBootstrapping(false));
  }, []);

  // React Query's cache keys (["projects", ...], ["tasks", ...]) don't
  // include a user id, so they don't naturally separate one person's
  // data from the next. On a full page reload that's harmless — the
  // QueryClient itself is recreated empty — but switching identity
  // WITHOUT a reload (logout, then a different account logs in on the
  // same tab) meant the new user's first render could briefly show
  // whatever the previous user's projects/tasks queries had cached,
  // until the fresh (correctly-scoped) fetch overwrote it a moment
  // later. Clearing on every identity transition — leaving one account
  // or entering another — closes that gap in both directions.
  const login = useCallback(
    async (credentials) => {
      const loggedInUser = await authApi.loginUser(credentials);
      queryClient.clear();
      setUser(loggedInUser);
      return loggedInUser;
    },
    [queryClient]
  );

  const register = useCallback(
    async (payload) => {
      const result = await authApi.registerUser(payload);
      // Verification enabled: result is { pendingVerification: true, email }
      // and there's no session to store yet — Register.jsx routes to the
      // verify-email screen instead of the dashboard based on this shape.
      if (result.pendingVerification) {
        return result;
      }
      queryClient.clear();
      setUser(result);
      return result;
    },
    [queryClient]
  );

  const verifyEmail = useCallback(
    async (payload) => {
      const verifiedUser = await authApi.verifyEmail(payload);
      queryClient.clear();
      setUser(verifiedUser);
      return verifiedUser;
    },
    [queryClient]
  );

  const loginWithGoogle = useCallback(
    async (credential) => {
      const googleUser = await authApi.loginWithGoogle(credential);
      queryClient.clear();
      setUser(googleUser);
      return googleUser;
    },
    [queryClient]
  );

  const logout = useCallback(async () => {
    // Clear local state regardless of whether the network call
    // succeeds — a failed logout request shouldn't trap the user
    // in a "still looks logged in" UI.
    await authApi.logoutUser().catch(() => {});
    queryClient.clear();
    setUser(null);
  }, [queryClient]);

  const value = {
    user,
    setUser, // exposed so profile mutations (Phase 15) can sync the navbar/sidebar
    // immediately with the mutation's own response, instead of a second round-trip.
    isAuthenticated: Boolean(user),
    isBootstrapping,
    login,
    register,
    verifyEmail,
    loginWithGoogle,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
