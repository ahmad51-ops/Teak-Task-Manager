import { Task } from "../models/Task.js";
import { Project } from "../models/Project.js";
import { ApiError } from "../utils/ApiError.js";
import { notify } from "./notificationService.js";
import { deleteFromCloudinary } from "../utils/uploadToCloudinary.js";
import { escapeRegex } from "../utils/escapeRegex.js";
import { getIO } from "../sockets/socket.js";

// Every task change that affects what's visible on a project's task
// list/board goes to the project room; changes to one specific task
// also go to that task's own room, for anyone with its detail page open.
const emitTaskEvent = (event, task) => {
  const io = getIO();
  if (!io) return;
  io.to(`project:${task.project}`).emit(event, { taskId: task._id, projectId: task.project });
  io.to(`task:${task._id}`).emit(event, { taskId: task._id, projectId: task.project });
};

const MANAGER_ROLES = ["owner", "admin"];

// See identical fix + explanation in projectService.js's getMemberEntry —
// this handles both populated and unpopulated project.members.user.
const getMemberEntry = (project, userId) =>
  project.members.find((m) => {
    const memberId = m.user._id ? m.user._id.toString() : m.user.toString();
    return memberId === userId.toString();
  });

const isProjectMember = (project, user) =>
  user.role === "admin" || Boolean(getMemberEntry(project, user._id));

const canManageProject = (project, user) => {
  if (user.role === "admin") return true;
  const membership = getMemberEntry(project, user._id);
  return Boolean(membership && MANAGER_ROLES.includes(membership.role));
};

const POPULATE = [
  { path: "project", select: "name status" },
  { path: "assignee", select: "name email avatar" },
  { path: "createdBy", select: "name email avatar" },
  { path: "attachments.uploadedBy", select: "name email" },
];

// Fields a client is allowed to sort by — whitelisted rather than
// passing req.query.sortBy straight into .sort(), which would let a
// request sort on arbitrary/unindexed fields.
const SORTABLE_FIELDS = ["createdAt", "dueDate", "priority", "title"];

const loadProjectOrThrow = async (projectId) => {
  const project = await Project.findById(projectId);
  if (!project) throw new ApiError(404, "Project not found");
  return project;
};

export const createTask = async (user, { project: projectId, assignee, ...rest }) => {
  const project = await loadProjectOrThrow(projectId);
  if (!isProjectMember(project, user)) {
    throw new ApiError(403, "You must be a member of this project to create tasks in it");
  }

  if (assignee) {
    // createTask is a second path that can set an assignee, alongside
    // the dedicated PATCH /:id/assign route (gated by restrictTo on
    // the route itself) — without this check, any project member could
    // assign a task to someone else simply by setting it at creation
    // instead of via /assign.
    if (!["admin", "manager"].includes(user.role)) {
      throw new ApiError(403, "Only an admin or manager can assign a task to someone");
    }
    if (!getMemberEntry(project, assignee) && project.owner.toString() !== assignee) {
      throw new ApiError(400, "Assignee must be a member of this project");
    }
  }

  const task = await Task.create({
    ...rest,
    project: projectId,
    assignee: assignee || null,
    createdBy: user._id,
  });

  if (assignee && assignee !== user._id.toString()) {
    await notify({
      recipient: assignee,
      type: "task_assigned",
      message: `You were assigned to "${task.title}"`,
      relatedTask: task._id,
      relatedProject: project._id,
    });
  }

  emitTaskEvent("task:created", task);

  return task.populate(POPULATE);
};

export const getTasks = async (
  user,
  { project: projectId, status, priority, assignee, search, sortBy, order, page = 1, limit = 20 }
) => {
  const query = {};

  if (projectId) {
    const project = await loadProjectOrThrow(projectId);
    if (!isProjectMember(project, user)) {
      throw new ApiError(403, "You are not a member of this project");
    }
    query.project = projectId;
  } else {
    // No project filter given — restrict to tasks in projects the user
    // actually belongs to, rather than leaking every task in the system.
    const memberProjects = await Project.find({
      $or: [{ owner: user._id }, { "members.user": user._id }],
    }).select("_id");
    query.project = { $in: memberProjects.map((p) => p._id) };
  }

  if (status) query.status = status;
  if (priority) query.priority = priority;
  if (assignee) query.assignee = assignee;
  // Partial/substring match, not whole-word $text — a live search box
  // needs "web" to match "Website Revamp" while the user is still
  // typing, which $text's word-tokenized matching can't do (it would
  // only match once "website" was typed in full). Case-insensitive.
  if (search) {
    const regex = new RegExp(escapeRegex(search.trim()), "i");
    query.$or = [{ title: regex }, { description: regex }];
  }

  const sortField = SORTABLE_FIELDS.includes(sortBy) ? sortBy : "createdAt";
  const sortOrder = order === "asc" ? 1 : -1;

  const skip = (page - 1) * limit;

  const [tasks, total] = await Promise.all([
    Task.find(query)
      .populate(POPULATE)
      .sort({ [sortField]: sortOrder })
      .skip(skip)
      .limit(Number(limit))
      // .lean() skips Mongoose document hydration (getters, virtuals,
      // change-tracking) since this result only ever gets JSON.stringify'd
      // and sent back — never saved. Meaningfully faster on list endpoints,
      // which return the most documents per request of anything in this app.
      .lean(),
    Task.countDocuments(query),
  ]);

  return {
    tasks,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getTaskById = async (taskId, user) => {
  const task = await Task.findById(taskId).populate(POPULATE).lean();
  if (!task) throw new ApiError(404, "Task not found");

  const project = await loadProjectOrThrow(task.project._id);
  if (!isProjectMember(project, user)) {
    throw new ApiError(403, "You are not a member of this project");
  }

  return task;
};

export const updateTask = async (taskId, user, updates) => {
  const task = await Task.findById(taskId);
  if (!task) throw new ApiError(404, "Task not found");

  const project = await loadProjectOrThrow(task.project);
  const isCreator = task.createdBy.toString() === user._id.toString();
  const isAssignee = task.assignee && task.assignee.toString() === user._id.toString();
  if (!isCreator && !isAssignee && !canManageProject(project, user)) {
    throw new ApiError(403, "You do not have permission to edit this task");
  }

  const allowedFields = ["title", "description", "priority", "dueDate", "tags"];
  for (const field of allowedFields) {
    if (updates[field] !== undefined) task[field] = updates[field];
  }
  await task.save();

  // Same recipient set as a new comment (creator + assignee, minus
  // whoever made the change) — both have a stake in a task they're
  // attached to changing under them.
  const editRecipients = new Set();
  if (task.createdBy.toString() !== user._id.toString()) {
    editRecipients.add(task.createdBy.toString());
  }
  if (task.assignee && task.assignee.toString() !== user._id.toString()) {
    editRecipients.add(task.assignee.toString());
  }
  for (const recipient of editRecipients) {
    await notify({
      recipient,
      type: "task_updated",
      message: `"${task.title}" was updated`,
      relatedTask: task._id,
      relatedProject: project._id,
    });
  }

  emitTaskEvent("task:updated", task);

  return task.populate(POPULATE);
};

export const deleteTask = async (taskId, user) => {
  const task = await Task.findById(taskId);
  if (!task) throw new ApiError(404, "Task not found");

  const project = await loadProjectOrThrow(task.project);
  const isCreator = task.createdBy.toString() === user._id.toString();
  if (!isCreator && !canManageProject(project, user)) {
    throw new ApiError(403, "Only the task creator or a project manager can delete this task");
  }

  await task.deleteOne();

  emitTaskEvent("task:deleted", task);
};

export const assignTask = async (taskId, user, assigneeId) => {
  const task = await Task.findById(taskId);
  if (!task) throw new ApiError(404, "Task not found");

  // Permission (must be global admin/manager) is enforced by
  // restrictTo("admin", "manager") on the route — self-claiming an
  // unassigned task is no longer a special case, per the same rule.
  const project = await loadProjectOrThrow(task.project);

  if (!getMemberEntry(project, assigneeId) && project.owner.toString() !== assigneeId) {
    throw new ApiError(400, "Assignee must be a member of this project");
  }

  task.assignee = assigneeId;
  await task.save();

  if (assigneeId !== user._id.toString()) {
    await notify({
      recipient: assigneeId,
      type: "task_assigned",
      message: `You were assigned to "${task.title}"`,
      relatedTask: task._id,
      relatedProject: project._id,
    });
  }

  emitTaskEvent("task:updated", task);

  return task.populate(POPULATE);
};

export const updateStatus = async (taskId, user, status) => {
  const task = await Task.findById(taskId);
  if (!task) throw new ApiError(404, "Task not found");

  const project = await loadProjectOrThrow(task.project);
  if (!isProjectMember(project, user)) {
    throw new ApiError(403, "You are not a member of this project");
  }

  const previousStatus = task.status;
  task.status = status;
  await task.save();

  // Any status change is notable to creator + assignee (minus whoever
  // moved it) — not just the "marked done" case this used to be limited to.
  if (status !== previousStatus) {
    const statusRecipients = new Set();
    if (task.createdBy.toString() !== user._id.toString()) {
      statusRecipients.add(task.createdBy.toString());
    }
    if (task.assignee && task.assignee.toString() !== user._id.toString()) {
      statusRecipients.add(task.assignee.toString());
    }
    for (const recipient of statusRecipients) {
      await notify({
        recipient,
        type: "task_status_changed",
        message: `"${task.title}" was moved to ${status}`,
        relatedTask: task._id,
        relatedProject: project._id,
      });
    }
  }

  emitTaskEvent("task:updated", task);

  return task.populate(POPULATE);
};

export const addAttachment = async (taskId, user, fileData) => {
  const task = await Task.findById(taskId);
  if (!task) throw new ApiError(404, "Task not found");

  const project = await loadProjectOrThrow(task.project);
  if (!isProjectMember(project, user)) {
    throw new ApiError(403, "You are not a member of this project");
  }

  task.attachments.push({
    url: fileData.url,
    filename: fileData.filename,
    publicId: fileData.publicId,
    resourceType: fileData.resourceType,
    uploadedBy: user._id,
  });
  await task.save();

  emitTaskEvent("task:updated", task);

  return task.populate(POPULATE);
};

export const removeAttachment = async (taskId, user, attachmentId) => {
  const task = await Task.findById(taskId);
  if (!task) throw new ApiError(404, "Task not found");

  const attachment = task.attachments.id(attachmentId);
  if (!attachment) throw new ApiError(404, "Attachment not found");

  const project = await loadProjectOrThrow(task.project);
  const isUploader = attachment.uploadedBy.toString() === user._id.toString();
  if (!isUploader && !canManageProject(project, user)) {
    throw new ApiError(403, "Only the uploader or a project manager can remove this attachment");
  }

  const { publicId, resourceType } = attachment;
  task.attachments.pull(attachmentId);
  await task.save();

  await deleteFromCloudinary(publicId, resourceType);

  emitTaskEvent("task:updated", task);

  return task.populate(POPULATE);
};
