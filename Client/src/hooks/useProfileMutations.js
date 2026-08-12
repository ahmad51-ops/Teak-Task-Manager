import { useMutation } from "@tanstack/react-query";
import * as userApi from "../api/userApi";
import { useAuth } from "./useAuth";

// These update AuthContext's user directly from the mutation's own
// response rather than triggering a second /auth/me round-trip — the
// backend already returns the updated user, so use it.
export const useUpdateProfile = () => {
  const { setUser } = useAuth();
  return useMutation({
    mutationFn: userApi.updateProfile,
    onSuccess: (updatedUser) => setUser(updatedUser),
  });
};

export const useChangePassword = () =>
  useMutation({
    mutationFn: userApi.changePassword,
  });

export const useUploadAvatar = () => {
  const { setUser } = useAuth();
  return useMutation({
    mutationFn: userApi.uploadAvatar,
    onSuccess: (updatedUser) => setUser(updatedUser),
  });
};