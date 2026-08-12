import { createContext, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSocket } from "../hooks/useSocket";

export const NotificationContext = createContext(null);

// Which cached queries each notification type makes stale. This is what
// fixes the "invited user sees the bell light up, but their project list
// doesn't update until they navigate away and back" problem: the invitee
// was never in that project's socket room (they weren't a member yet),
// so the project:updated room broadcast couldn't reach them. Their
// personal notification is the only signal they get — so it has to be
// the thing that triggers the refetch.
const INVALIDATION_MAP = {
  project_invite: [["projects"]],
  project_updated: [["projects"]],
  task_assigned: [["tasks"], ["dashboard"]],
  task_status_changed: [["tasks"], ["dashboard"]],
  task_updated: [["tasks"], ["dashboard"]],
  comment_added: [["comments"]],
  due_date_reminder: [["tasks"], ["dashboard"]],
};

export const NotificationProvider = ({ children }) => {
  const socket = useSocket();
  const queryClient = useQueryClient();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!socket) return;

    const handleNew = (notification) => {
      setNotifications((prev) => [notification, ...prev].slice(0, 20));

      const keysToInvalidate = INVALIDATION_MAP[notification.type] || [];
      keysToInvalidate.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey });
      });
    };

    socket.on("notification:new", handleNew);
    return () => socket.off("notification:new", handleNew);
  }, [socket, queryClient]);

  const markAllSeen = () => setNotifications((prev) => prev.map((n) => ({ ...n, seen: true })));
  const unseenCount = notifications.filter((n) => !n.seen).length;

  return (
    <NotificationContext.Provider value={{ notifications, unseenCount, markAllSeen }}>
      {children}
    </NotificationContext.Provider>
  );
};
