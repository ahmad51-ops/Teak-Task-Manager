import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as commentApi from "../api/commentApi";

export const useComments = (taskId) =>
  useQuery({
    queryKey: ["comments", taskId],
    queryFn: () => commentApi.getComments(taskId, { limit: 50 }),
    enabled: Boolean(taskId),
  });

const useInvalidateComments = (taskId) => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["comments", taskId] });
};

export const useCreateComment = (taskId) => {
  const invalidate = useInvalidateComments(taskId);
  return useMutation({
    mutationFn: (content) => commentApi.createComment(taskId, content),
    onSuccess: invalidate,
  });
};

export const useUpdateComment = (taskId) => {
  const invalidate = useInvalidateComments(taskId);
  return useMutation({
    mutationFn: ({ commentId, content }) => commentApi.updateComment(taskId, commentId, content),
    onSuccess: invalidate,
  });
};

export const useDeleteComment = (taskId) => {
  const invalidate = useInvalidateComments(taskId);
  return useMutation({
    mutationFn: (commentId) => commentApi.deleteComment(taskId, commentId),
    onSuccess: invalidate,
  });
};
