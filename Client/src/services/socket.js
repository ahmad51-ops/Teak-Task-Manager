import { io } from "socket.io-client";
import { getAccessToken } from "../api/axios";

let socket = null;

// One socket for the whole app lifetime, connected once the user is
// authenticated — not one per component. Components join/leave specific
// rooms (project:id, task:id) via useSocket.js rather than creating
// their own connections.
export const connectSocket = () => {
  if (socket?.connected) return socket;

  socket = io("/", {
    // Vite's dev proxy (vite.config.js) only proxies /api by default;
    // Socket.io needs its own path but rides the same origin/port, so
    // no separate proxy entry is required — just point at "/".
    auth: { token: getAccessToken() },
    withCredentials: true,
    autoConnect: true,
  });

  return socket;
};

export const disconnectSocket = () => {
  socket?.disconnect();
  socket = null;
};

export const getSocket = () => socket;
