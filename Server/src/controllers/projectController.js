import * as projectService from "../services/projectService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export const createProject = asyncHandler(async (req, res) => {
  const project = await projectService.createProject(req.user._id, req.body);
  res.status(201).json(new ApiResponse(201, project, "Project created"));
});

export const getProjects = asyncHandler(async (req, res) => {
  const { search, status, sortBy, order, page = 1, limit = 10 } = req.query;
  const result = await projectService.getProjects(req.user._id, {
    search,
    status,
    sortBy,
    order,
    page,
    limit,
  });
  res.status(200).json(new ApiResponse(200, result, "Projects fetched"));
});

export const getProjectById = asyncHandler(async (req, res) => {
  const project = await projectService.getProjectById(req.params.id, req.user);
  res.status(200).json(new ApiResponse(200, project, "Project fetched"));
});

export const updateProject = asyncHandler(async (req, res) => {
  const project = await projectService.updateProject(req.params.id, req.user, req.body);
  res.status(200).json(new ApiResponse(200, project, "Project updated"));
});

export const deleteProject = asyncHandler(async (req, res) => {
  await projectService.deleteProject(req.params.id, req.user);
  res.status(200).json(new ApiResponse(200, {}, "Project deleted"));
});

export const archiveProject = asyncHandler(async (req, res) => {
  const project = await projectService.setArchiveStatus(req.params.id, req.user, true);
  res.status(200).json(new ApiResponse(200, project, "Project archived"));
});

export const restoreProject = asyncHandler(async (req, res) => {
  const project = await projectService.setArchiveStatus(req.params.id, req.user, false);
  res.status(200).json(new ApiResponse(200, project, "Project restored"));
});

export const inviteMember = asyncHandler(async (req, res) => {
  const project = await projectService.inviteMember(req.params.id, req.user, req.body);
  res.status(200).json(new ApiResponse(200, project, "Member invited"));
});

export const removeMember = asyncHandler(async (req, res) => {
  const project = await projectService.removeMember(req.params.id, req.user, req.params.userId);
  res.status(200).json(new ApiResponse(200, project, "Member removed"));
});

export const updateMemberRole = asyncHandler(async (req, res) => {
  const project = await projectService.updateMemberRole(
    req.params.id,
    req.user,
    req.params.userId,
    req.body.role
  );
  res.status(200).json(new ApiResponse(200, project, "Member role updated"));
});
