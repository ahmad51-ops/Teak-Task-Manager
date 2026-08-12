// Wraps an async route handler so any thrown error (or rejected promise)
// is passed to next(), landing in our global error handler — instead of
// crashing the process or requiring try/catch in every controller.
//
// Usage: router.get("/", asyncHandler(async (req, res) => { ... }))
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
