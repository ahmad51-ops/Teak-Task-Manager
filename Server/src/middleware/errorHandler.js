import { ApiError } from "../utils/ApiError.js";
import { env } from "../config/env.js";

// Express recognizes this as an error handler because it takes 4 args.
// Must be registered LAST, after all routes.
export const errorHandler = (err, req, res, next) => {
  let error = err;

  // Normalize known Mongoose errors into ApiError so the response shape
  // stays consistent no matter what threw.
  if (err.name === "CastError") {
    error = new ApiError(400, `Invalid ${err.path}: ${err.value}`);
  } else if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    error = new ApiError(409, `${field} already exists`);
  } else if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((val) => val.message);
    error = new ApiError(400, messages.join(", "));
  } else if (err.name === "MulterError") {
    error = new ApiError(400, err.message);
  } else if (!(err instanceof ApiError)) {
    error = new ApiError(err.statusCode || 500, err.message || "Internal Server Error");
  }

  if (env.nodeEnv === "development") {
    console.error(err);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message,
    errors: error.errors || [],
    // Never leak stack traces in production responses.
    ...(env.nodeEnv === "development" && { stack: err.stack }),
  });
};

// Catches requests to routes that don't exist — must sit right before
// errorHandler in the middleware chain.
export const notFound = (req, res, next) => {
  next(new ApiError(404, `Route not found: ${req.originalUrl}`));
};