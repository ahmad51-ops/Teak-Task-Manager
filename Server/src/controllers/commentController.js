import * as commentService from "../services/commentService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// req.params.id here is the TASK id — this router is mounted inside
// taskRoutes.js at "/:id/comments", with mergeParams:true so it can see it.

export const createComment = asyncHandler(async (req, res) => {
  const comment = await commentService.createComment(req.user, req.params.id, req.body.content);
  res.status(201).json(new ApiResponse(201, comment, "Comment added"));
});

export const getComments = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const result = await commentService.getComments(req.user, req.params.id, { page, limit });
  res.status(200).json(new ApiResponse(200, result, "Comments fetched"));
});

export const updateComment = asyncHandler(async (req, res) => {
  const comment = await commentService.updateComment(req.user, req.params.commentId, req.body.content);
  res.status(200).json(new ApiResponse(200, comment, "Comment updated"));
});

export const deleteComment = asyncHandler(async (req, res) => {
  await commentService.deleteComment(req.user, req.params.commentId);
  res.status(200).json(new ApiResponse(200, {}, "Comment deleted"));
});
