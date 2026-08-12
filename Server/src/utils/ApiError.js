// A single error shape used everywhere: throw new ApiError(404, "Task not found")
// The global error handler (middleware/errorHandler.js) knows how to read this.
export class ApiError extends Error {
  constructor(statusCode, message = "Something went wrong", errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.success = false;

    Error.captureStackTrace(this, this.constructor);
  }
}
