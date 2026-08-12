import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as taskApi from "../api/taskApi";

// Every task change can affect: the tasks list (any active filter), this
// task's own detail view, and the dashboard's live counts (Phase 12).
// Invalidating all three keeps every screen honest without wiring manual
// refetch calls at each call site.
const useInvalidateTasks = () => {
  const queryClient = useQueryClient();
  return (id) => {
    queryClient.invalidateQueries({ queryKey: ["tasks"] });
    if (id) queryClient.invalidateQueries({ queryKey: ["tasks", "detail", id] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };
};

export const useCreateTask = () => {
  const invalidate = useInvalidateTasks();
  return useMutation({
    mutationFn: taskApi.createTask,
    onSuccess: () => invalidate(),
  });
};

export const useUpdateTask = (id) => {
  const invalidate = useInvalidateTasks();
  return useMutation({
    mutationFn: (payload) => taskApi.updateTask(id, payload),
    onSuccess: () => invalidate(id),
  });
};

export const useDeleteTask = () => {
  const invalidate = useInvalidateTasks();
  return useMutation({
    mutationFn: (id) => taskApi.deleteTask(id),
    onSuccess: () => invalidate(),
  });
};

export const useAssignTask = (id) => {
  const invalidate = useInvalidateTasks();
  return useMutation({
    mutationFn: (assignee) => taskApi.assignTask(id, assignee),
    onSuccess: () => invalidate(id),
  });
};

export const useUpdateTaskStatus = (id) => {
  const invalidate = useInvalidateTasks();
  return useMutation({
    mutationFn: (status) => taskApi.updateTaskStatus(id, status),
    onSuccess: () => invalidate(id),
  });
};

export const useAddAttachment = (id) => {
  const invalidate = useInvalidateTasks();
  return useMutation({
    mutationFn: (file) => taskApi.addAttachment(id, file),
    onSuccess: () => invalidate(id),
  });
};

export const useRemoveAttachment = (id) => {
  const invalidate = useInvalidateTasks();
  return useMutation({
    mutationFn: (attachmentId) => taskApi.removeAttachment(id, attachmentId),
    onSuccess: () => invalidate(id),
  });
};
