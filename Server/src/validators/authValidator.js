import { body } from "express-validator";

// Shared so registration and password-change enforce the exact same
// rule — it'd be a strange experience to set a password at signup that
// the change-password form would later reject.
export const passwordRule = (field) =>
  body(field)
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/[a-zA-Z]/)
    .withMessage("Password must contain at least one letter");

export const registerValidator = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters"),
  body("email").isEmail().withMessage("Please provide a valid email").normalizeEmail(),
  passwordRule("password"),
];

export const verifyEmailValidator = [
  body("email").isEmail().withMessage("Please provide a valid email").normalizeEmail(),
  body("code")
    .trim()
    .isLength({ min: 6, max: 6 })
    .withMessage("Enter the 6-digit code")
    .isNumeric()
    .withMessage("The code is numeric"),
];

export const resendVerificationValidator = [
  body("email").isEmail().withMessage("Please provide a valid email").normalizeEmail(),
];

export const loginValidator = [
  body("email").isEmail().withMessage("Please provide a valid email").normalizeEmail(),
  // Deliberately no strength rule on login — an existing account may
  // predate the current policy, and rejecting it here would lock them
  // out of the very form they'd use to change it.
  body("password").notEmpty().withMessage("Password is required"),
];