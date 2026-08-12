// These mirror the permission rules already enforced server-side
// (projectService.js / taskService.js). Duplicating them here is purely
// for UX — hiding buttons a request would 403 on anyway — never for
// actual security. The backend is the real gate in every case.

export const getMembership = (project, userId) =>
  project?.members?.find((m) => m.user._id === userId);

export const isProjectManager = (project, user) => {
  if (!project || !user) return false;
  if (user.role === "admin") return true;
  if (project.owner?._id === user._id) return true;
  const membership = getMembership(project, user._id);
  return membership?.role === "owner" || membership?.role === "admin";
};

export const isProjectMember = (project, user) => {
  if (!project || !user) return false;
  if (user.role === "admin") return true;
  if (project.owner?._id === user._id) return true;
  return Boolean(getMembership(project, user._id));
};

// Creating a project, inviting members, and assigning tasks (including
// claiming one for yourself) are gated on global role alone — unlike
// isProjectManager above, project membership/ownership doesn't grant it.
export const canManageWorkspace = (user) => user?.role === "admin" || user?.role === "manager";
