import { useEffect, useState } from "react";
import { connectSocket, disconnectSocket, getSocket } from "../services/socket";
import { useAuth } from "./useAuth";

// Connects once, when the user is authenticated; disconnects on logout.
// Individual pages (ProjectDetails, TaskDetails) use the returned socket
// to join/leave specific rooms for the duration they're mounted — this
// hook only owns the connection itself, not any particular subscription.
//
// The socket instance is held in state (not a ref) deliberately: a ref
// update doesn't trigger a re-render, so a caller like NotificationContext
// — mounted from the very first render, before any socket exists — could
// end up permanently holding the `null` it read on that first render,
// with nothing forcing it to re-render once connectSocket() actually
// resolves a few ticks later. State makes that transition visible.
export const useSocket = () => {
  const { isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(getSocket());

  useEffect(() => {
    if (isAuthenticated) {
      setSocket(connectSocket());
    } else {
      disconnectSocket();
      setSocket(null);
    }

    return () => {
      if (!isAuthenticated) disconnectSocket();
    };
  }, [isAuthenticated]);

  return socket;
};
