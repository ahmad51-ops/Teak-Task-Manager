import { Project } from "../models/Project.js";
import { User } from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { escapeRegex } from "../utils/escapeRegex.js";
import { getIO } from "../sockets/socket.js";
import { notify } from "./notificationService.js";

// Anyone with this project's detail page open (joined the "project:{id}"
// room) sees membership/status/detail changes live.
const emitProjectUpdated = (projectId) => {
  const io = getIO();
  if (!io) return;
  io.to(`project:${projectId}`).emit("project:updated", { projectId });
};

const MANAGER_ROLES = ["owner", "admin"];

// Works whether m.user is a raw ObjectId (most call sites, which check
// permissions on an unpopulated project) OR a fully populated User
// document (getProjectById populates before checking membership) —
// m.user.toString() on a populated document does NOT return its id,
// it returns "[object Object]", so that comparison silently fails for
// any populated project. This was the bug behind "you are not a member"
// showing up for actual members when viewing a project's details.
const getMemberEntry = (project, userId) =>
  project.members.find((m) => {
    const memberId = m.user._id ? m.user._id.toString() : m.user.toString();
    return memberId === userId.toString();
  });

const canManageProject = (project, user) => {
  if (user.role === "admin") return true;
  const membership = getMemberEntry(project, user._id);
  return Boolean(membership && MANAGER_ROLES.includes(membership.role));
};

// Every member except whoever triggered the change — used for
// project-level notifications (edit, archive/restore), where "project
// members" as a whole is the meaningful audience, unlike task-level
// notifications which target just the creator/assignee.
const notifyMembers = async (project, actorId, { type, message }) => {
  const recipients = project.members
    .map((m) => (m.user._id ? m.user._id.toString() : m.user.toString()))
    .filter((id) => id !== actorId.toString());

  for (const recipient of recipients) {
    await notify({
      recipient,
      type,
      message,
      relatedProject: project._id,
    });
  }
};

const POPULATE_FIELDS = "name email avatar";
const SORTABLE_FIELDS = ["createdAt", "name"];

export const createProject = async (ownerId, { name, description }) => {
  const project = await Project.create({
    name,
    description,
    owner: ownerId,
    members: [{ user: ownerId, role: "owner" }],
  });
  return project.populate([
    { path: "owner", select: POPULATE_FIELDS },
    { path: "members.user", select: POPULATE_FIELDS },
  ]);
};

export const getProjects = async (userId, { search, status, sortBy, order, page = 1, limit = 10 }) => {
  // A project shows up for you if you own it OR you're in its members list.
  const membershipFilter = { $or: [{ owner: userId }, { "members.user": userId }] };

  // Two separate $or clauses (membership, and search-across-fields) can't
  // both live as top-level "$or" keys on the same object — the second
  // would silently overwrite the first. $and keeps them both in force.
  const conditions = [membershipFilter];
  if (status) conditions.push({ status });
  if (search) {
    // Partial/substring match, not whole-word $text — see the identical
    // reasoning in taskService.js. Case-insensitive.
    const regex = new RegExp(escapeRegex(search.trim()), "i");
    conditions.push({ $or: [{ name: regex }, { description: regex }] });
  }
  const query = conditions.length > 1 ? { $and: conditions } : membershipFilter;

  const sortField = SORTABLE_FIELDS.includes(sortBy) ? sortBy : "createdAt";
  const sortOrder = order === "asc" ? 1 : -1;

  const skip = (page - 1) * limit;

  const [projects, total] = await Promise.all([
    Project.find(query)
      .populate("owner", POPULATE_FIELDS)
      .populate("members.user", POPULATE_FIELDS)
      .sort({ [sortField]: sortOrder })
      .skip(skip)
      .limit(Number(limit))
      .lean(), // read-only response — see identical reasoning in taskService.js
    Project.countDocuments(query),
  ]);

  return {
    projects,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getProjectById = async (projectId, user) => {
  const project = await Project.findById(projectId)
    .populate("owner", POPULATE_FIELDS)
    .populate("members.user", POPULATE_FIELDS)
    .lean();
  if (!project) throw new ApiError(404, "Project not found");

  const isMember = user.role === "admin" || getMemberEntry(project, user._id);
  if (!isMember) throw new ApiError(403, "You are not a member of this project");

  return project;
};

export const updateProject = async (projectId, user, updates) => {
  const project = await Project.findById(projectId);
  if (!project) throw new ApiError(404, "Project not found");
  if (!canManageProject(project, user)) {
    throw new ApiError(403, "Only the project owner or a project admin can update this project");
  }

  const allowedFields = ["name", "description"];
  for (const field of allowedFields) {
    if (updates[field] !== undefined) project[field] = updates[field];
  }
  await project.save();
  emitProjectUpdated(project._id);
  await notifyMembers(project, user._id, {
    type: "project_updated",
    message: `"${project.name}" was updated`,
  });
  return project.populate([
    { path: "owner", select: POPULATE_FIELDS },
    { path: "members.user", select: POPULATE_FIELDS },
  ]);
};

export const deleteProject = async (projectId, user) => {
  const project = await Project.findById(projectId);
  if (!project) throw new ApiError(404, "Project not found");

  const isOwner = project.owner.toString() === user._id.toString();
  if (!isOwner && user.role !== "admin") {
    throw new ApiError(403, "Only the project owner can delete this project");
  }

  await project.deleteOne();
};

export const setArchiveStatus = async (projectId, user, archive) => {
  const project = await Project.findById(projectId);
  if (!project) throw new ApiError(404, "Project not found");
  if (!canManageProject(project, user)) {
    throw new ApiError(403, "Only the project owner or a project admin can change this project's status");
  }

  project.status = archive ? "archived" : "active";
  await project.save();
  emitProjectUpdated(project._id);
  await notifyMembers(project, user._id, {
    type: "project_updated",
    message: `"${project.name}" was ${archive ? "archived" : "restored"}`,
  });
  return project;
};

export const inviteMember = async (projectId, user, { userId, email, role = "member" }) => {
  // Permission (must be global admin/manager) is enforced by
  // restrictTo("admin", "manager") on the route — no per-project
  // membership check needed here, unlike the other project-mutating
  // actions below which key off THIS project's owner/admin list.
  const project = await Project.findById(projectId);
  if (!project) throw new ApiError(404, "Project not found");

  // Prefer userId (sent by the invite dropdown, which only ever lists
  // real users). email is kept as a fallback so the endpoint stays
  // usable directly — e.g. from Postman or a future "invite by email"
  // flow — rather than silently breaking older callers.
  const invitee = userId
    ? await User.findById(userId)
    : await User.findOne({ email });
  if (!invitee) throw new ApiError(404, "No user found to invite");
  if (!invitee.isActive) throw new ApiError(400, "That account has been deactivated");

  if (getMemberEntry(project, invitee._id)) {
    throw new ApiError(409, "This user is already a member of the project");
  }

  project.members.push({ user: invitee._id, role });
  await project.save();

  await notify({
    recipient: invitee._id,
    type: "project_invite",
    message: `You were added to "${project.name}"`,
    relatedProject: project._id,
  });

  emitProjectUpdated(project._id);

  return project.populate([
    { path: "owner", select: POPULATE_FIELDS },
    { path: "members.user", select: POPULATE_FIELDS },
  ]);
};

export const removeMember = async (projectId, user, targetUserId) => {
  const project = await Project.findById(projectId);
  if (!project) throw new ApiError(404, "Project not found");
  if (!canManageProject(project, user)) {
    throw new ApiError(403, "Only the project owner or a project admin can remove members");
  }
  if (project.owner.toString() === targetUserId.toString()) {
    throw new ApiError(400, "The project owner cannot be removed");
  }

  project.members = project.members.filter(
    (m) => m.user.toString() !== targetUserId.toString()
  );
  await project.save();
  emitProjectUpdated(project._id);
  return project.populate([
    { path: "owner", select: POPULATE_FIELDS },
    { path: "members.user", select: POPULATE_FIELDS },
  ]);
};

export const updateMemberRole = async (projectId, user, targetUserId, newRole) => {
  const project = await Project.findById(projectId);
  if (!project) throw new ApiError(404, "Project not found");

  const isOwner = project.owner.toString() === user._id.toString();
  if (!isOwner && user.role !== "admin") {
    throw new ApiError(403, "Only the project owner can change member roles");
  }

  const member = getMemberEntry(project, targetUserId);
  if (!member) throw new ApiError(404, "This user is not a member of the project");

  member.role = newRole;
  await project.save();
  emitProjectUpdated(project._id);
  return project.populate([
    { path: "owner", select: POPULATE_FIELDS },
    { path: "members.user", select: POPULATE_FIELDS },
  ]);
};
