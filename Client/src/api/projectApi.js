import api from "./axios";

export const getProjects = async (params = {}) => {
  const { data } = await api.get("/projects", { params });
  return data.data; // { projects, pagination }
};

export const getProjectById = async (id) => {
  const { data } = await api.get(`/projects/${id}`);
  return data.data;
};

export const createProject = async (payload) => {
  const { data } = await api.post("/projects", payload);
  return data.data;
};

export const updateProject = async (id, payload) => {
  const { data } = await api.patch(`/projects/${id}`, payload);
  return data.data;
};

export const deleteProject = async (id) => {
  await api.delete(`/projects/${id}`);
};

export const setProjectArchiveStatus = async (id, archive) => {
  const endpoint = archive ? "archive" : "restore";
  const { data } = await api.patch(`/projects/${id}/${endpoint}`);
  return data.data;
};

export const inviteMember = async (id, payload) => {
  const { data } = await api.post(`/projects/${id}/members`, payload);
  return data.data;
};

export const removeMember = async (id, userId) => {
  const { data } = await api.delete(`/projects/${id}/members/${userId}`);
  return data.data;
};

export const updateMemberRole = async (id, userId, role) => {
  const { data } = await api.patch(`/projects/${id}/members/${userId}/role`, { role });
  return data.data;
};
