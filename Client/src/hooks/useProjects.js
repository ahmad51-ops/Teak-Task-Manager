import { useQuery } from "@tanstack/react-query";
import { getProjects, getProjectById } from "../api/projectApi";

export const useProjects = (params = {}) =>
  useQuery({
    queryKey: ["projects", params],
    queryFn: () => getProjects(params),
  });

export const useProject = (id) =>
  useQuery({
    queryKey: ["projects", id],
    queryFn: () => getProjectById(id),
    enabled: Boolean(id),
  });
