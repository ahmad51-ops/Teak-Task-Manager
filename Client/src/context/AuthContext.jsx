import { createContext, useCallback, useEffect, useState } from "react";
import * as authApi from "../api/authApi";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  // True only during the initial "is there an existing session?" check
  // on app load — PrivateRoute uses this to avoid flashing a redirect
  // to /login before we've even asked the backend.
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  useEffect(() => {
    authApi
      .restoreSession()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setIsBootstrapping(false));
  }, []);

  const login = useCallback(async (credentials) => {
    const loggedInUser = await authApi.loginUser(credentials);
    setUser(loggedInUser);
    return loggedInUser;
  }, []);

  const register = useCallback(async (payload) => {
    const newUser = await authApi.registerUser(payload);
    setUser(newUser);
    return newUser;
  }, []);

  const loginWithGoogle = useCallback(async (credential) => {
    const googleUser = await authApi.loginWithGoogle(credential);
    setUser(googleUser);
    return googleUser;
  }, []);

  const logout = useCallback(async () => {
    // Clear local state regardless of whether the network call
    // succeeds — a failed logout request shouldn't trap the user
    // in a "still looks logged in" UI.
    await authApi.logoutUser().catch(() => {});
    setUser(null);
  }, []);

  const value = {
    user,
    setUser, // exposed so profile mutations (Phase 15) can sync the navbar/sidebar
    // immediately with the mutation's own response, instead of a second round-trip.
    isAuthenticated: Boolean(user),
    isBootstrapping,
    login,
    register,
    loginWithGoogle,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
