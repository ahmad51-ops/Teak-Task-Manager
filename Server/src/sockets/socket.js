import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { User } from "../models/User.js";
import { Project } from "../models/Project.js";
import { Task } from "../models/Task.js";

// Singleton, same pattern as the Cloudinary config — one instance,
// initialized once from server.js, imported wherever an emit is needed
// (notificationService.js, taskService.js, etc.) without having to
// thread `io` through every function signature.
let io = null;

export const getIO = () => io;

// userId -> number of open sockets for that user. A count, not a boolean
// set, because one person can legitimately have several tabs open —
// closing one shouldn't mark them offline while the others are still
// connected. In-memory by design: presence is inherently ephemeral, and
// a multi-instance deployment would need a Redis adapter for this
// anyway (flagged in Phase 19's deployment notes).
const onlineUsers = new Map();

export const isUserOnline = (userId) => onlineUsers.has(userId.toString());

export const getOnlineUserIds = () => Array.from(onlineUsers.keys());

const isProjectMember = (project, userId) => {
  if (project.owner.toString() === userId.toString()) return true;
  return project.members.some((m) => m.user.toString() === userId.toString());
};

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: env.clientUrl,
      credentials: true,
    },
  });

  // Auth happens once, at connection time — same access token the
  // frontend already holds in memory (api/axios.js), sent via the
  // socket.io handshake auth payload rather than a header.
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Not authorized — no token provided"));

      const decoded = jwt.verify(token, env.jwt.accessSecret);
      const user = await User.findById(decoded.id);
      if (!user || !user.isActive) return next(new Error("Not authorized"));

      socket.userId = user._id.toString();
      next();
    } catch {
      next(new Error("Not authorized — token invalid or expired"));
    }
  });

  io.on("connection", (socket) => {
    // Every user's own private room — this is what notificationService.js
    // targets for "you were assigned a task" / "new comment" pushes.
    socket.join(`user:${socket.userId}`);

    // --- Presence ---
    const previousCount = onlineUsers.get(socket.userId) || 0;
    onlineUsers.set(socket.userId, previousCount + 1);
    // Only broadcast on the FIRST connection for this user — opening a
    // second tab isn't a "came online" event worth telling anyone about.
    if (previousCount === 0) {
      io.emit("presence:online", { userId: socket.userId });
    }

    socket.on("disconnect", async () => {
      const count = (onlineUsers.get(socket.userId) || 1) - 1;
      if (count > 0) {
        onlineUsers.set(socket.userId, count);
        return; // other tabs still open — they're not offline
      }

      onlineUsers.delete(socket.userId);
      const lastSeen = new Date();
      try {
        await User.findByIdAndUpdate(socket.userId, { lastSeen });
      } catch {
        // A failed lastSeen write shouldn't throw inside a disconnect
        // handler — worst case the timestamp is slightly stale.
      }
      io.emit("presence:offline", { userId: socket.userId, lastSeen });
    });

    // Rooms are joined on demand, not automatically for every project a
    // user belongs to — a user with 40 projects shouldn't get every
    // project's events just because they're a member; only the ones
    // they currently have open in the UI.
    socket.on("project:join", async (projectId) => {
      try {
        const project = await Project.findById(projectId);
        if (project && isProjectMember(project, socket.userId)) {
          socket.join(`project:${projectId}`);
        }
      } catch {
        // Invalid ObjectId or similar — silently ignore rather than
        // crash the socket connection over a malformed join request.
      }
    });

    socket.on("project:leave", (projectId) => {
      socket.leave(`project:${projectId}`);
    });

    socket.on("task:join", async (taskId) => {
      try {
        const task = await Task.findById(taskId);
        if (!task) return;
        const project = await Project.findById(task.project);
        if (project && isProjectMember(project, socket.userId)) {
          socket.join(`task:${taskId}`);
        }
      } catch {
        // Same as above — ignore malformed requests.
      }
    });

    socket.on("task:leave", (taskId) => {
      socket.leave(`task:${taskId}`);
    });
  });

  return io;
};
