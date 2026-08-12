import { Router } from "express";
import {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  assignTask,
  updateStatus,
  addAttachment,
  removeAttachment,
} from "../controllers/taskController.js";
import {
  createTaskValidator,
  updateTaskValidator,
  assignTaskValidator,
  updateStatusValidator,
} from "../validators/taskValidator.js";
import { validate } from "../middleware/validate.js";
import { protect } from "../middleware/auth.js";
import { restrictTo } from "../middleware/role.js";
import { uploadAttachment } from "../middleware/upload.js";
import commentRoutes from "./commentRoutes.js";

const router = Router();

router.use(protect);

router.post("/", createTaskValidator, validate, createTask);
router.get("/", getTasks); // ?project=&status=&assignee=&page=&limit=
router.get("/:id", getTaskById);
router.patch("/:id", updateTaskValidator, validate, updateTask);
router.delete("/:id", deleteTask);

// Assigning (including claiming a task for yourself) is restricted to
// admin/manager — gated by global role, same as project creation/invites.
router.patch("/:id/assign", restrictTo("admin", "manager"), assignTaskValidator, validate, assignTask);
router.patch("/:id/status", updateStatusValidator, validate, updateStatus);

router.post("/:id/attachments", uploadAttachment, addAttachment);
router.delete("/:id/attachments/:attachmentId", removeAttachment);

// Nested resource: Task -> Comments -> User. commentRoutes reads :id
// (the task ID) via mergeParams, so all comment endpoints live at
// /api/v1/tasks/:id/comments...
router.use("/:id/comments", commentRoutes);

export default router;
