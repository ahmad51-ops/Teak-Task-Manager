import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as projectApi from "../api/projectApi";

// One invalidation helper reused by every mutation below — any change to
// a project should refresh both the list (card view) and that project's
// own detail query, since either might be showing stale data afterward.
const useInvalidateProjects = () => {
  const queryClient = useQueryClient();
  return (projectId) => {
    queryClient.invalidateQueries({ queryKey: ["projects"] });
    if (projectId) {
      queryClient.invalidateQueries({ queryKey: ["projects", projectId] });
    }
  };
};

export const useCreateProject = () => {
  const invalidate = useInvalidateProjects();
  return useMutation({
    mutationFn: projectApi.createProject,
    onSuccess: () => invalidate(),
  });
};

export const useUpdateProject = (id) => {
  const invalidate = useInvalidateProjects();
  return useMutation({
    mutationFn: (payload) => projectApi.updateProject(id, payload),
    onSuccess: () => invalidate(id),
  });
};

export const useDeleteProject = () => {
  const invalidate = useInvalidateProjects();
  return useMutation({
    mutationFn: (id) => projectApi.deleteProject(id),
    onSuccess: () => invalidate(),
  });
};

export const useSetArchiveStatus = (id) => {
  const invalidate = useInvalidateProjects();
  return useMutation({
    mutationFn: (archive) => projectApi.setProjectArchiveStatus(id, archive),
    onSuccess: () => invalidate(id),
  });
};

export const useInviteMember = (id) => {
  const invalidate = useInvalidateProjects();
  return useMutation({
    mutationFn: (payload) => projectApi.inviteMember(id, payload),
    onSuccess: () => invalidate(id),
  });
};

export const useRemoveMember = (id) => {
  const invalidate = useInvalidateProjects();
  return useMutation({
    mutationFn: (userId) => projectApi.removeMember(id, userId),
    onSuccess: () => invalidate(id),
  });
};

export const useUpdateMemberRole = (id) => {
  const invalidate = useInvalidateProjects();
  return useMutation({
    mutationFn: ({ userId, role }) => projectApi.updateMemberRole(id, userId, role),
    onSuccess: () => invalidate(id),
  });
};
