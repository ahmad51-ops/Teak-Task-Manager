import { body } from "express-validator";
import { passwordRule } from "./authValidator.js";

export const updateProfileValidator = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters"),
];

export const changePasswordValidator = [
  body("currentPassword").notEmpty().withMessage("Current password is required"),
  // Imports the SAME rule registration uses rather than restating it.
  // These had drifted apart — registration required 8 chars + a letter
  // while this also demanded a number, so a password accepted at signup
  // could be rejected when changing it. One definition, one behaviour.
  passwordRule("newPassword"),
];

export const updateRoleValidator = [
  body("role")
    .isIn(["admin", "manager", "member"])
    .withMessage("Role must be one of: admin, manager, member"),
];
