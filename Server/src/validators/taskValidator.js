import { body } from "express-validator";

export const createTaskValidator = [
  body("title")
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage("Title must be between 3 and 200 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage("Description cannot exceed 2000 characters"),
  body("project").isMongoId().withMessage("A valid project ID is required"),
  body("priority")
    .optional()
    .isIn(["low", "medium", "high", "urgent"])
    .withMessage("Priority must be low, medium, high, or urgent"),
  body("dueDate").optional().isISO8601().withMessage("Due date must be a valid date"),
  body("assignee").optional().isMongoId().withMessage("Assignee must be a valid user ID"),
];

export const updateTaskValidator = [
  body("title")
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage("Title must be between 3 and 200 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage("Description cannot exceed 2000 characters"),
  body("priority")
    .optional()
    .isIn(["low", "medium", "high", "urgent"])
    .withMessage("Priority must be low, medium, high, or urgent"),
  body("dueDate").optional().isISO8601().withMessage("Due date must be a valid date"),
];

export const assignTaskValidator = [
  body("assignee").isMongoId().withMessage("A valid user ID is required"),
];

export const updateStatusValidator = [
  body("status")
    .isIn(["todo", "in-progress", "review", "done"])
    .withMessage("Status must be todo, in-progress, review, or done"),
];
