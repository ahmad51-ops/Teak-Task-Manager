import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/User.js";

// Reads the access token from the Authorization header (Bearer scheme),
// verifies it, and attaches the real user document to req.user for
// every downstream handler. Any route needing login goes through this.
export const protect = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new ApiError(401, "Not authorized — no token provided");
  }

  const token = authHeader.split(" ")[1];

  let decoded;
  try {
    decoded = jwt.verify(token, env.jwt.accessSecret);
  } catch {
    // Covers both expired and tampered/invalid tokens with one message —
    // the frontend's response is the same either way: try refreshing.
    throw new ApiError(401, "Not authorized — token invalid or expired");
  }

  const user = await User.findById(decoded.id);
  if (!user) {
    throw new ApiError(401, "The user for this token no longer exists");
  }
  if (!user.isActive) {
    throw new ApiError(403, "This account has been deactivated");
  }

  req.user = user;
  next();
});