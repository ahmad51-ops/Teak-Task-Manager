import { io } from "socket.io-client";
import { getAccessToken } from "../api/axios";

let socket = null;

// One socket for the whole app lifetime, connected once the user is
// authenticated — not one per component. Components join/leave specific
// rooms (project:id, task:id) via useSocket.js rather than creating
// their own connections.
export const connectSocket = () => {
  if (socket?.connected) return socket;

  // In local dev, VITE_API_URL is unset and "/" resolves to this same
  // origin, which Vite's dev proxy (vite.config.js) forwards to the
  // backend's socket.io handler. In production, frontend and backend
  // are different origins (Vercel/Render), so this needs the backend's
  // actual URL — same variable axios.js uses for REST calls.
  socket = io(import.meta.env.VITE_API_URL || "/", {
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
