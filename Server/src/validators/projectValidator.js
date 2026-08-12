import { body } from "express-validator";

export const createProjectValidator = [
  body("name")
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage("Project name must be between 3 and 100 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Description cannot exceed 1000 characters"),
];

export const updateProjectValidator = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage("Project name must be between 3 and 100 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Description cannot exceed 1000 characters"),
];

export const inviteMemberValidator = [
  // Either userId (from the invite dropdown) or email (direct/API use)
  // is acceptable — but at least one must be present, hence the custom
  // check rather than marking either individually required.
  body().custom((value) => {
    if (!value.userId && !value.email) {
      throw new Error("Select a user to invite");
    }
    return true;
  }),
  body("userId").optional().isMongoId().withMessage("Invalid user selected"),
  body("email").optional().isEmail().withMessage("Please provide a valid email").normalizeEmail(),
  body("role")
    .optional()
    .isIn(["admin", "member"])
    .withMessage("Role must be admin or member"),
];

export const updateMemberRoleValidator = [
  body("role").isIn(["admin", "member"]).withMessage("Role must be admin or member"),
];
