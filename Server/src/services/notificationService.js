import { Notification } from "../models/Notification.js";
import { getIO } from "../sockets/socket.js";

// This is the single chokepoint every notification already passes
// through (task assignment, status-done, new comments — see
// taskService.js / commentService.js). Adding the emit here, once,
// means every notification type becomes real-time automatically instead
// of hunting down each call site individually.
export const notify = async ({ recipient, type, message, relatedTask, relatedProject }) => {
  let notification;
  try {
    notification = await Notification.create({ recipient, type, message, relatedTask, relatedProject });
  } catch (err) {
    console.error(`Failed to create notification: ${err.message}`);
    return;
  }

  const io = getIO();
  if (io) {
    io.to(`user:${recipient}`).emit("notification:new", {
      _id: notification._id,
      type: notification.type,
      message: notification.message,
      relatedTask: notification.relatedTask,
      relatedProject: notification.relatedProject,
      createdAt: notification.createdAt,
    });
  }
};
