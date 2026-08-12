import jwt from "jsonwebtoken";
import {
  registerUser,
  loginUser,
  loginWithGoogle,
  verifyEmail,
  resendVerificationCode,
} from "../services/authService.js";
import { generateAccessToken } from "../utils/generateToken.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/User.js";
import { env, isGoogleAuthEnabled } from "../config/env.js";

const refreshCookieOptions = {
  httpOnly: true,
  secure: env.nodeEnv === "production",
  // "strict"/"lax" only send the cookie on same-site requests — fine in
  // dev where frontend and backend share localhost, but frontend
  // (Vercel) and backend (Render) are different origins in production,
  // so the refresh call would silently never receive the cookie at all.
  // "none" requires secure:true, which is already conditional above.
  sameSite: env.nodeEnv === "production" ? "none" : "strict",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export const register = asyncHandler(async (req, res) => {
  const result = await registerUser(req.body);

  // Verification enabled: no account is logged in yet — registerUser
  // returned { pendingVerification, email } instead of tokens.
  if (result.pendingVerification) {
    return res
      .status(201)
      .json(new ApiResponse(201, result, "Check your email for a verification code"));
  }

  const { user, accessToken, refreshToken } = result;
  res.cookie("refreshToken", refreshToken, refreshCookieOptions);
  res.status(201).json(new ApiResponse(201, { user, accessToken }, "Registered successfully"));
});

export const verifyEmailController = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await verifyEmail(req.body);
  res.cookie("refreshToken", refreshToken, refreshCookieOptions);
  res.status(200).json(new ApiResponse(200, { user, accessToken }, "Email verified"));
});

export const resendVerification = asyncHandler(async (req, res) => {
  await resendVerificationCode(req.body.email);
  res.status(200).json(new ApiResponse(200, {}, "Verification code sent"));
});

export const login = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await loginUser(req.body);
  res.cookie("refreshToken", refreshToken, refreshCookieOptions);
  res.status(200).json(new ApiResponse(200, { user, accessToken }, "Logged in successfully"));
});

// Receives the ID token ("credential") that Google Identity Services
// hands the frontend — the browser never sees our client secret, and
// this server never handles the user's Google password.
export const googleLogin = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await loginWithGoogle(req.body.credential);
  res.cookie("refreshToken", refreshToken, refreshCookieOptions);
  res.status(200).json(new ApiResponse(200, { user, accessToken }, "Signed in with Google"));
});

// Lets the frontend decide whether to render the Google button at all,
// instead of showing a button that would fail on a server without
// GOOGLE_CLIENT_ID configured.
export const getAuthConfig = asyncHandler(async (req, res) => {
  res.status(200).json(
    new ApiResponse(200, {
      googleEnabled: isGoogleAuthEnabled,
      googleClientId: env.google.clientId || null,
    })
  );
});

export const refreshAccessToken = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) {
    throw new ApiError(401, "No refresh token provided");
  }

  let decoded;
  try {
    decoded = jwt.verify(token, env.jwt.refreshSecret);
  } catch {
    throw new ApiError(401, "Refresh token invalid or expired — please log in again");
  }

  const user = await User.findById(decoded.id);
  if (!user) {
    throw new ApiError(401, "User no longer exists");
  }

  const accessToken = generateAccessToken(user._id);
  res.status(200).json(new ApiResponse(200, { accessToken }, "Access token refreshed"));
});

export const logout = asyncHandler(async (req, res) => {
  res.clearCookie("refreshToken", refreshCookieOptions);
  res.status(200).json(new ApiResponse(200, {}, "Logged out successfully"));
});

export const getMe = asyncHandler(async (req, res) => {
  res.status(200).json(new ApiResponse(200, req.user, "Current user fetched"));
});
