import { Comment } from "../models/Comment.js";
import { Task } from "../models/Task.js";
import { Project } from "../models/Project.js";
import { ApiError } from "../utils/ApiError.js";
import { notify } from "./notificationService.js";
import { getIO } from "../sockets/socket.js";

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

const loadTaskAndProject = async (taskId) => {
  const task = await Task.findById(taskId);
  if (!task) throw new ApiError(404, "Task not found");
  const project = await Project.findById(task.project);
  if (!project) throw new ApiError(404, "Project not found");
  return { task, project };
};

// Anyone with this task's detail page open (i.e. joined the "task:{id}"
// room — see sockets/socket.js) gets the live update. Kept to just the
// task room, not the project room too — a new comment doesn't change
// what a project-level task list/board looks like.
const emitCommentEvent = (event, taskId, payload = {}) => {
  const io = getIO();
  if (!io) return;
  io.to(`task:${taskId}`).emit(event, { taskId, ...payload });
};

export const createComment = async (user, taskId, content) => {
  const { task, project } = await loadTaskAndProject(taskId);
  if (!isProjectMember(project, user)) {
    throw new ApiError(403, "You are not a member of this project");
  }

  const comment = await Comment.create({ task: taskId, author: user._id, content });
  const populated = await Comment.findById(comment._id).populate("author", "name email avatar");

  const recipients = new Set();
  if (task.createdBy.toString() !== user._id.toString()) {
    recipients.add(task.createdBy.toString());
  }
  if (task.assignee && task.assignee.toString() !== user._id.toString()) {
    recipients.add(task.assignee.toString());
  }
  for (const recipient of recipients) {
    await notify({
      recipient,
      type: "comment_added",
      message: `New comment on "${task.title}"`,
      relatedTask: task._id,
      relatedProject: project._id,
    });
  }

  emitCommentEvent("comment:added", taskId, { commentId: populated._id });

  return populated;
};

export const getComments = async (user, taskId, { page = 1, limit = 20 }) => {
  const { project } = await loadTaskAndProject(taskId);
  if (!isProjectMember(project, user)) {
    throw new ApiError(403, "You are not a member of this project");
  }

  const skip = (page - 1) * limit;
  const [comments, total] = await Promise.all([
    Comment.find({ task: taskId })
      .populate("author", "name email avatar")
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Comment.countDocuments({ task: taskId }),
  ]);

  return {
    comments,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const updateComment = async (user, commentId, content) => {
  const comment = await Comment.findById(commentId);
  if (!comment) throw new ApiError(404, "Comment not found");

  if (comment.author.toString() !== user._id.toString()) {
    throw new ApiError(403, "You can only edit your own comments");
  }

  comment.content = content;
  await comment.save();

  emitCommentEvent("comment:updated", comment.task, { commentId: comment._id });

  return comment.populate("author", "name email avatar");
};

export const deleteComment = async (user, commentId) => {
  const comment = await Comment.findById(commentId);
  if (!comment) throw new ApiError(404, "Comment not found");

  const { project } = await loadTaskAndProject(comment.task);
  const isAuthor = comment.author.toString() === user._id.toString();
  if (!isAuthor && !canManageProject(project, user)) {
    throw new ApiError(403, "Only the comment author or a project manager can delete this comment");
  }

  const taskId = comment.task;
  await comment.deleteOne();

  emitCommentEvent("comment:deleted", taskId, { commentId });
};
