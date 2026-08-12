import api from "./axios";

export const updateProfile = async (payload) => {
  const { data } = await api.patch("/users/profile", payload);
  return data.data;
};

export const changePassword = async ({ currentPassword, newPassword }) => {
  await api.patch("/users/change-password", { currentPassword, newPassword });
};

export const uploadAvatar = async (file) => {
  const formData = new FormData();
  formData.append("avatar", file);
  // Deliberately NOT setting Content-Type here. Hard-coding
  // "multipart/form-data" omits the required boundary= parameter, so
  // the server can't parse the body and req.file arrives undefined.
  // Letting the browser set it means it generates the boundary itself.
  const { data } = await api.post("/users/avatar", formData);
  return data.data;
};

// Users who can still be added to this project — everyone active who
// isn't already a member. Powers the invite dropdown.
export const getInvitableUsers = async (projectId) => {
  const { data } = await api.get(`/users/invitable/${projectId}`);
  return data.data;
};

// Admin-only directory with live online / last-seen presence.
export const getUserDirectory = async (params = {}) => {
  const { data } = await api.get("/users/directory", { params });
  return data.data; // { users, pagination }
};

export const updateUserRole = async (userId, role) => {
  const { data } = await api.patch(`/users/${userId}/role`, { role });
  return data.data;
};

export const deactivateUser = async (userId) => {
  const { data } = await api.patch(`/users/${userId}/deactivate`);
  return data.data;
};

export const reactivateUser = async (userId) => {
  const { data } = await api.patch(`/users/${userId}/reactivate`);
  return data.data;
};
