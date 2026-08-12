import * as userService from "../services/userService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadBufferToCloudinary } from "../utils/uploadToCloudinary.js";

// --- Self-service endpoints (any authenticated user) ---

export const getProfile = asyncHandler(async (req, res) => {
  res.status(200).json(new ApiResponse(200, req.user, "Profile fetched"));
});

export const updateProfile = asyncHandler(async (req, res) => {
  const user = await userService.updateProfile(req.user._id, req.body);
  res.status(200).json(new ApiResponse(200, user, "Profile updated"));
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  await userService.changePassword(req.user._id, currentPassword, newPassword);
  res.status(200).json(new ApiResponse(200, {}, "Password changed successfully"));
});

export const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, "No file uploaded");

  const result = await uploadBufferToCloudinary(req.file.buffer, {
    folder: "team-task-manager/avatars",
    resourceType: "image",
  });

  const user = await userService.updateAvatar(req.user._id, {
    url: result.secure_url,
    publicId: result.public_id,
  });

  res.status(200).json(new ApiResponse(200, user, "Avatar uploaded"));
});

// Any project member needs this to populate the invite dropdown — it's
// deliberately NOT admin-gated, since inviting is a project-manager
// action, not a site-admin one. The project-level permission check still
// happens on the actual invite call (projectService.inviteMember).
export const getInvitableUsers = asyncHandler(async (req, res) => {
  const users = await userService.getInvitableUsers(req.params.projectId);
  res.status(200).json(new ApiResponse(200, users, "Invitable users fetched"));
});

// --- Admin / Manager endpoints ---

export const getAllUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search = "" } = req.query;
  const result = await userService.getAllUsers({ page, limit, search });
  res.status(200).json(new ApiResponse(200, result, "Users fetched"));
});

// Admin-only directory with live online/last-seen status.
export const getUserDirectory = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, search = "" } = req.query;
  const result = await userService.getAllUsersWithPresence({ page, limit, search });
  res.status(200).json(new ApiResponse(200, result, "User directory fetched"));
});

export const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  const user = await userService.updateUserRole(req.params.id, role);
  res.status(200).json(new ApiResponse(200, user, "User role updated"));
});

export const deactivateUser = asyncHandler(async (req, res) => {
  const user = await userService.deactivateUser(req.params.id);
  res.status(200).json(new ApiResponse(200, user, "User deactivated"));
});

export const reactivateUser = asyncHandler(async (req, res) => {
  const user = await userService.reactivateUser(req.params.id);
  res.status(200).json(new ApiResponse(200, user, "User reactivated"));
});
