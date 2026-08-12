import { useQuery } from "@tanstack/react-query";
import { getTasks, getTaskById } from "../api/taskApi";

export const useTasks = (params = {}) =>
  useQuery({
    queryKey: ["tasks", params],
    queryFn: () => getTasks(params),
    enabled: Boolean(params.project) || params.project === undefined,
  });

export const useTask = (id) =>
  useQuery({
    queryKey: ["tasks", "detail", id],
    queryFn: () => getTaskById(id),
    enabled: Boolean(id),
  });
