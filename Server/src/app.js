import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import compression from "compression";
import { env } from "./config/env.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import { requestLogger } from "./middleware/logger.js";
import { ApiResponse } from "./utils/ApiResponse.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";

const app = express();

// --- Security & parsing middleware ---
// Helmet's default CSP blocks Google Identity Services outright — the
// script, the iframe it opens for the account chooser, and its styles
// all need explicit allowances or the sign-in button silently fails to
// render. Everything else stays at Helmet's defaults.
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "script-src": ["'self'", "'unsafe-inline'", "https://accounts.google.com", "https://apis.google.com"],
        "frame-src": ["'self'", "https://accounts.google.com"],
        "connect-src": ["'self'", "https://accounts.google.com"],
        "img-src": ["'self'", "data:", "https:"],
        "style-src": ["'self'", "'unsafe-inline'", "https://accounts.google.com", "https://fonts.googleapis.com"],
        "font-src": ["'self'", "https://fonts.gstatic.com", "data:"],
      },
    },
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  })
);

app.use(
  cors({
    origin: env.clientUrl,
    credentials: true,
  })
);

// Gzips every JSON response before it goes over the wire — task/project
// list responses (especially populated ones) can be tens of KB of JSON;
// compression routinely cuts that by 70-80%, which matters more for
// response *time* on a slow connection than any query optimization does.
app.use(compression());

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());

app.use(requestLogger);

// Note: no local /uploads static serving as of Phase 9 — avatars
// and attachments are Cloudinary URLs, served directly from there.

// --- Health check ---
app.get("/api/v1/health", (req, res) => {
  res.status(200).json(new ApiResponse(200, { uptime: process.uptime() }, "Server is healthy"));
});

// --- Feature routes ---
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/projects", projectRoutes);
app.use("/api/v1/tasks", taskRoutes);

// TEMPORARY — Phase 3 model-testing routes only.
if (env.nodeEnv === "development") {
  const devTestRoutes = (await import("./routes/devTestRoutes.js")).default;
  app.use("/api/v1/dev", devTestRoutes);
}

// --- Error handling (must be last) ---
app.use(notFound);
app.use(errorHandler);

export default app;
