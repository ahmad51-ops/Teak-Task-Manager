import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as userApi from "../api/userApi";
import { useSocket } from "./useSocket";

export const useInvitableUsers = (projectId) =>
  useQuery({
    queryKey: ["users", "invitable", projectId],
    queryFn: () => userApi.getInvitableUsers(projectId),
    enabled: Boolean(projectId),
  });

// Admin directory. Presence changes arrive over the socket rather than
// by polling — presence:online / presence:offline are broadcast to
// everyone (see sockets/socket.js), so this just invalidates on either
// and lets the normal refetch pick up the new isOnline/lastSeen values.
export const useUserDirectory = (params = {}) => {
  const queryClient = useQueryClient();
  const socket = useSocket();

  const query = useQuery({
    queryKey: ["users", "directory", params],
    queryFn: () => userApi.getUserDirectory(params),
  });

  useEffect(() => {
    if (!socket) return;
    const handlePresence = () => {
      queryClient.invalidateQueries({ queryKey: ["users", "directory"] });
    };
    socket.on("presence:online", handlePresence);
    socket.on("presence:offline", handlePresence);
    return () => {
      socket.off("presence:online", handlePresence);
      socket.off("presence:offline", handlePresence);
    };
  }, [socket, queryClient]);

  return query;
};

const useInvalidateUsers = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["users"] });
};

export const useUpdateUserRole = () => {
  const invalidate = useInvalidateUsers();
  return useMutation({
    mutationFn: ({ userId, role }) => userApi.updateUserRole(userId, role),
    onSuccess: invalidate,
  });
};

export const useSetUserActive = () => {
  const invalidate = useInvalidateUsers();
  return useMutation({
    mutationFn: ({ userId, active }) =>
      active ? userApi.reactivateUser(userId) : userApi.deactivateUser(userId),
    onSuccess: invalidate,
  });
};
