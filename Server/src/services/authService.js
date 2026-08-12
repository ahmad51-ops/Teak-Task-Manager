import { OAuth2Client } from "google-auth-library";
import { User } from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { generateAccessToken, generateRefreshToken } from "../utils/generateToken.js";
import { env, isGoogleAuthEnabled } from "../config/env.js";

const googleClient = isGoogleAuthEnabled ? new OAuth2Client(env.google.clientId) : null;

const issueTokens = (user) => ({
  user,
  accessToken: generateAccessToken(user._id),
  refreshToken: generateRefreshToken(user._id),
});

export const registerUser = async ({ name, email, password }) => {
  const existing = await User.findOne({ email });
  if (existing) {
    throw new ApiError(409, "An account with this email already exists");
  }

  const user = await User.create({ name, email, password });
  return issueTokens(user);
};

export const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  // A Google-created account has no password to compare against.
  // Telling them to use the Google button is far more useful than a
  // generic "invalid password" they'd never be able to satisfy.
  if (!user.password) {
    throw new ApiError(
      401,
      "This account was created with Google — use the 'Continue with Google' button to sign in"
    );
  }

  if (!(await user.comparePassword(password))) {
    throw new ApiError(401, "Invalid email or password");
  }

  if (!user.isActive) {
    throw new ApiError(403, "This account has been deactivated");
  }

  return issueTokens(user);
};

export const loginWithGoogle = async (credential) => {
  if (!googleClient) {
    throw new ApiError(503, "Google sign-in is not configured on this server");
  }
  if (!credential) {
    throw new ApiError(400, "No Google credential provided");
  }

  let payload;
  try {
    // Verifies the token's signature, expiry, AND that it was issued
    // for this exact app (audience) — without the audience check, a
    // token minted for any other Google app would be accepted here.
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: env.google.clientId,
    });
    payload = ticket.getPayload();
  } catch {
    throw new ApiError(401, "Could not verify that Google account — please try again");
  }

  const { sub: googleId, email, name, picture, email_verified: emailVerified } = payload;

  if (!emailVerified) {
    throw new ApiError(403, "That Google account's email isn't verified");
  }

  // 1. Returning Google user
  let user = await User.findOne({ googleId });
  if (user) {
    if (!user.isActive) throw new ApiError(403, "This account has been deactivated");
    return issueTokens(user);
  }

  // 2. Existing password account with the same email — link the two
  //    rather than erroring on the unique-email index or silently
  //    creating a duplicate account. Safe because Google has verified
  //    ownership of this email address (checked above).
  user = await User.findOne({ email });
  if (user) {
    if (!user.isActive) throw new ApiError(403, "This account has been deactivated");
    user.googleId = googleId;
    if (!user.avatar && picture) user.avatar = picture;
    await user.save();
    return issueTokens(user);
  }

  // 3. Brand-new user
  user = await User.create({
    name: name || email.split("@")[0],
    email,
    googleId,
    avatar: picture || "",
  });

  return issueTokens(user);
};
