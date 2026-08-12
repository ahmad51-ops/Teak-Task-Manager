import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

// Short-lived — sent back in the response body, kept in memory on the
// frontend (never localStorage, never a non-httpOnly cookie).
export const generateAccessToken = (userId) =>
  jwt.sign({ id: userId }, env.jwt.accessSecret, { expiresIn: env.jwt.accessExpires });

// Long-lived — only ever travels inside an httpOnly cookie, so client-side
// JS can never read it (mitigates XSS token theft).
export const generateRefreshToken = (userId) =>
  jwt.sign({ id: userId }, env.jwt.refreshSecret, { expiresIn: env.jwt.refreshExpires });