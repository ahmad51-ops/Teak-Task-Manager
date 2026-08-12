import api from "./axios";

export const getComments = async (taskId, params = {}) => {
  const { data } = await api.get(`/tasks/${taskId}/comments`, { params });
  return data.data; // { comments, pagination }
};

export const createComment = async (taskId, content) => {
  const { data } = await api.post(`/tasks/${taskId}/comments`, { content });
  return data.data;
};

export const updateComment = async (taskId, commentId, content) => {
  const { data } = await api.patch(`/tasks/${taskId}/comments/${commentId}`, { content });
  return data.data;
};

export const deleteComment = async (taskId, commentId) => {
  await api.delete(`/tasks/${taskId}/comments/${commentId}`);
};
