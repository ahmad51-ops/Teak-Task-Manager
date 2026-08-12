import * as taskService from "../services/taskService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadBufferToCloudinary } from "../utils/uploadToCloudinary.js";

export const createTask = asyncHandler(async (req, res) => {
  const task = await taskService.createTask(req.user, req.body);
  res.status(201).json(new ApiResponse(201, task, "Task created"));
});

export const getTasks = asyncHandler(async (req, res) => {
  const {
    project,
    status,
    priority,
    assignee,
    search,
    sortBy,
    order,
    page = 1,
    limit = 20,
  } = req.query;
  const result = await taskService.getTasks(req.user, {
    project,
    status,
    priority,
    assignee,
    search,
    sortBy,
    order,
    page,
    limit,
  });
  res.status(200).json(new ApiResponse(200, result, "Tasks fetched"));
});

export const getTaskById = asyncHandler(async (req, res) => {
  const task = await taskService.getTaskById(req.params.id, req.user);
  res.status(200).json(new ApiResponse(200, task, "Task fetched"));
});

export const updateTask = asyncHandler(async (req, res) => {
  const task = await taskService.updateTask(req.params.id, req.user, req.body);
  res.status(200).json(new ApiResponse(200, task, "Task updated"));
});

export const deleteTask = asyncHandler(async (req, res) => {
  await taskService.deleteTask(req.params.id, req.user);
  res.status(200).json(new ApiResponse(200, {}, "Task deleted"));
});

export const assignTask = asyncHandler(async (req, res) => {
  const task = await taskService.assignTask(req.params.id, req.user, req.body.assignee);
  res.status(200).json(new ApiResponse(200, task, "Task assigned"));
});

export const updateStatus = asyncHandler(async (req, res) => {
  const task = await taskService.updateStatus(req.params.id, req.user, req.body.status);
  res.status(200).json(new ApiResponse(200, task, "Task status updated"));
});

export const addAttachment = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, "No file uploaded");

  const result = await uploadBufferToCloudinary(req.file.buffer, {
    folder: "team-task-manager/attachments",
    resourceType: "auto",
  });

  const task = await taskService.addAttachment(req.params.id, req.user, {
    url: result.secure_url,
    publicId: result.public_id,
    resourceType: result.resource_type,
    filename: req.file.originalname,
  });

  res.status(201).json(new ApiResponse(201, task, "Attachment added"));
});

export const removeAttachment = asyncHandler(async (req, res) => {
  const task = await taskService.removeAttachment(req.params.id, req.user, req.params.attachmentId);
  res.status(200).json(new ApiResponse(200, task, "Attachment removed"));
});
