import api from "./axios";

export const getTasks = async (params = {}) => {
  const { data } = await api.get("/tasks", { params });
  return data.data; // { tasks, pagination }
};

export const getTaskById = async (id) => {
  const { data } = await api.get(`/tasks/${id}`);
  return data.data;
};

export const createTask = async (payload) => {
  const { data } = await api.post("/tasks", payload);
  return data.data;
};

export const updateTask = async (id, payload) => {
  const { data } = await api.patch(`/tasks/${id}`, payload);
  return data.data;
};

export const deleteTask = async (id) => {
  await api.delete(`/tasks/${id}`);
};

export const assignTask = async (id, assignee) => {
  const { data } = await api.patch(`/tasks/${id}/assign`, { assignee });
  return data.data;
};

export const updateTaskStatus = async (id, status) => {
  const { data } = await api.patch(`/tasks/${id}/status`, { status });
  return data.data;
};

export const addAttachment = async (id, file) => {
  const formData = new FormData();
  formData.append("attachment", file);
  // See the note in userApi.js — never hard-code the multipart
  // Content-Type; the browser must set it to include the boundary.
  const { data } = await api.post(`/tasks/${id}/attachments`, formData);
  return data.data;
};

export const removeAttachment = async (id, attachmentId) => {
  const { data } = await api.delete(`/tasks/${id}/attachments/${attachmentId}`);
  return data.data;
};
