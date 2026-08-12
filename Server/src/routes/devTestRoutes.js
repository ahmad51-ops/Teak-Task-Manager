// TEMPORARY — Phase 3 checkpoint only.
// These routes exist purely so you can POST directly against each model
// via Postman and confirm validation/references/indexes work, before
// real controllers (with auth, hashing checks, business logic) land in
// Phase 4–8. Delete this file once authRoutes/projectRoutes/taskRoutes/
// etc. replace it.

import { Router } from "express";
import { User } from "../models/User.js";
import { Project } from "../models/Project.js";
import { Task } from "../models/Task.js";
import { Comment } from "../models/Comment.js";
import { Notification } from "../models/Notification.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const router = Router();

router.post(
  "/users",
  asyncHandler(async (req, res) => {
    const user = await User.create(req.body);
    res.status(201).json(new ApiResponse(201, user, "User created"));
  })
);

router.post(
  "/projects",
  asyncHandler(async (req, res) => {
    const project = await Project.create(req.body);
    res.status(201).json(new ApiResponse(201, project, "Project created"));
  })
);

router.post(
  "/tasks",
  asyncHandler(async (req, res) => {
    const task = await Task.create(req.body);
    res.status(201).json(new ApiResponse(201, task, "Task created"));
  })
);

router.post(
  "/comments",
  asyncHandler(async (req, res) => {
    const comment = await Comment.create(req.body);
    res.status(201).json(new ApiResponse(201, comment, "Comment created"));
  })
);

router.post(
  "/notifications",
  asyncHandler(async (req, res) => {
    const notification = await Notification.create(req.body);
    res.status(201).json(new ApiResponse(201, notification, "Notification created"));
  })
);

// Handy GET-all versions for each, so you can eyeball what's in the DB
// without opening Compass.
router.get(
  "/users",
  asyncHandler(async (req, res) => {
    const users = await User.find();
    res.status(200).json(new ApiResponse(200, users));
  })
);
router.get(
  "/projects",
  asyncHandler(async (req, res) => {
    const projects = await Project.find().populate("owner", "name email");
    res.status(200).json(new ApiResponse(200, projects));
  })
);
router.get(
  "/tasks",
  asyncHandler(async (req, res) => {
    const tasks = await Task.find().populate("project assignee createdBy");
    res.status(200).json(new ApiResponse(200, tasks));
  })
);

export default router;
