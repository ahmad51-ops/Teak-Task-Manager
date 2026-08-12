import { body } from "express-validator";

export const commentValidator = [
  body("content")
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage("Comment must be between 1 and 2000 characters"),
];
