import { validationResult } from "express-validator";
import { ApiError } from "../utils/ApiError.js";

// Sits after a chain of express-validator checks in a route:
//   router.post("/register", registerValidator, validate, register)
// registerValidator only *collects* errors; this middleware is what
// actually stops the request and reports them.
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();

  const formatted = errors.array().map((err) => ({
    field: err.path,
    message: err.msg,
  }));

  throw new ApiError(400, "Validation failed", formatted);
};