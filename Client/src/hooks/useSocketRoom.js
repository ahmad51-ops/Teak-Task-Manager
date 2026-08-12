import { useEffect } from "react";
import { useSocket } from "./useSocket";

// Joins `roomId` via `joinEvent` on mount, leaves via `leaveEvent` on
// unmount, and wires up `onEvent` as the listener for each event name
// in `events`. Used by ProjectDetails (project:join/leave) and
// TaskDetails (task:join/leave) so live updates only flow to whoever
// actually has that page open — not every member of every project.
export const useSocketRoom = ({ joinEvent, leaveEvent, roomId, events = [], onEvent }) => {
  const socket = useSocket();

  useEffect(() => {
    if (!socket || !roomId) return;

    socket.emit(joinEvent, roomId);
    events.forEach((event) => socket.on(event, onEvent));

    return () => {
      socket.emit(leaveEvent, roomId);
      events.forEach((event) => socket.off(event, onEvent));
    };
    // Deliberately re-runs only when the room itself changes, not on
    // every render of onEvent — callers pass a stable-enough handler.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, roomId, joinEvent, leaveEvent]);
};
