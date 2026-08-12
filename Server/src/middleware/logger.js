import morgan from "morgan";
import { env } from "../config/env.js";

// Kept as its own file (rather than inline in app.js) so you can swap
// morgan for a real logger later (winston/pino) without touching app.js —
// only this file changes.
const format = env.nodeEnv === "development" ? "dev" : "combined";

export const requestLogger = morgan(format, {
  // In production you'd usually pipe this to a file or log service
  // instead of stdout — swap the `stream` option here when you get there.
  skip: () => env.nodeEnv === "test",
});