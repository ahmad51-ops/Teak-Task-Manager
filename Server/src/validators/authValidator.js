import { body } from "express-validator";

// Plain lowercasing only — NOT the library default. validator.js's
// normalizeEmail() defaults to rewriting Gmail addresses (stripping
// dots and +subaddressing: "John.Doe@gmail.com" -> "johndoe@gmail.com"),
// which only ever runs on THIS path. Google Sign-In (authService.js's
// loginWithGoogle) takes the email straight from Google's ID token —
// dots intact, no rewriting — so the same real inbox could normalize
// to two different stored strings depending on which signup path was
// used, letting the same person end up with two accounts for one
// email. Disabling the provider-specific rewriting keeps both paths
// producing the exact same string for the same address.
const EMAIL_NORMALIZE_OPTIONS = {
  gmail_remove_dots: false,
  gmail_remove_subaddress: false,
  gmail_convert_googlemaildotcom: false,
  outlookdotcom_remove_subaddress: false,
  yahoo_remove_subaddress: false,
  icloud_remove_subaddress: false,
};

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
  body("email")
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail(EMAIL_NORMALIZE_OPTIONS),
  passwordRule("password"),
];

export const verifyEmailValidator = [
  body("email")
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail(EMAIL_NORMALIZE_OPTIONS),
  body("code")
    .trim()
    .isLength({ min: 6, max: 6 })
    .withMessage("Enter the 6-digit code")
    .isNumeric()
    .withMessage("The code is numeric"),
];

export const resendVerificationValidator = [
  body("email")
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail(EMAIL_NORMALIZE_OPTIONS),
];

export const loginValidator = [
  body("email")
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail(EMAIL_NORMALIZE_OPTIONS),
  // Deliberately no strength rule on login — an existing account may
  // predate the current policy, and rejecting it here would lock them
  // out of the very form they'd use to change it.
  body("password").notEmpty().withMessage("Password is required"),
];