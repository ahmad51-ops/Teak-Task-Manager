import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
import { User } from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { generateAccessToken, generateRefreshToken } from "../utils/generateToken.js";
import { sendVerificationEmail } from "../utils/sendEmail.js";
import { env, isGoogleAuthEnabled, isEmailVerificationEnabled } from "../config/env.js";

const googleClient = isGoogleAuthEnabled ? new OAuth2Client(env.google.clientId) : null;

const issueTokens = (user) => ({
  user,
  accessToken: generateAccessToken(user._id),
  refreshToken: generateRefreshToken(user._id),
});

const CODE_TTL_MS = 15 * 60 * 1000;

const hashCode = (code) => crypto.createHash("sha256").update(code).digest("hex");

// randomInt's upper bound is exclusive, so this is always exactly 6 digits
// (100000-999999) — never a shorter number that would need zero-padding.
const generateCode = () => String(crypto.randomInt(100000, 1000000));

const issueVerificationCode = async (user) => {
  const code = generateCode();
  user.emailVerificationCodeHash = hashCode(code);
  user.emailVerificationExpires = new Date(Date.now() + CODE_TTL_MS);
  await user.save();

  // Deliberately NOT awaited — the code is already saved, which is the
  // part that actually has to succeed before responding. Awaiting an
  // SMTP round-trip here would mean a slow or flaky mail provider (or a
  // network hiccup between Render and Gmail) makes "Create account"
  // itself hang, when the account is already fully created at this
  // point. A failed send just means the user needs "Resend it" — it
  // shouldn't fail the request that got them this far.
  sendVerificationEmail(user.email, code)
    .then(() => console.log(`Verification email accepted for delivery to ${user.email}`))
    .catch((err) => {
      console.error(`Failed to send verification email to ${user.email}: ${err.message}`);
    });
};

export const registerUser = async ({ name, email, password }) => {
  const existing = await User.findOne({ email });

  // Blanket block, verified or not — an unverified account that never
  // got its code still owns this email; the way back in for it is
  // /verify-email's own "Resend it" (resendVerificationCode below), not
  // a second trip through registration.
  if (existing) {
    throw new ApiError(409, "An account with this email already exists");
  }

  const user = await User.create({
    name,
    email,
    password,
    isEmailVerified: !isEmailVerificationEnabled,
  });

  if (isEmailVerificationEnabled) {
    await issueVerificationCode(user);
    return { pendingVerification: true, email: user.email };
  }

  return issueTokens(user);
};

export const verifyEmail = async ({ email, code }) => {
  const user = await User.findOne({ email }).select(
    "+emailVerificationCodeHash +emailVerificationExpires"
  );
  if (!user) {
    throw new ApiError(404, "No account found for this email");
  }
  if (user.isEmailVerified) {
    throw new ApiError(400, "This email is already verified — just log in");
  }
  if (!user.emailVerificationExpires || user.emailVerificationExpires < new Date()) {
    throw new ApiError(400, "That code has expired — request a new one");
  }
  if (hashCode(code) !== user.emailVerificationCodeHash) {
    throw new ApiError(400, "That code doesn't match — check and try again");
  }

  user.isEmailVerified = true;
  user.emailVerificationCodeHash = null;
  user.emailVerificationExpires = null;
  await user.save();

  return issueTokens(user);
};

export const resendVerificationCode = async (email) => {
  if (!isEmailVerificationEnabled) {
    throw new ApiError(503, "Email verification is not configured on this server");
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(404, "No account found for this email");
  }
  if (user.isEmailVerified) {
    throw new ApiError(400, "This email is already verified — just log in");
  }

  await issueVerificationCode(user);
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

  if (isEmailVerificationEnabled && !user.isEmailVerified) {
    throw new ApiError(
      403,
      "Please verify your email before signing in — check your inbox for the code, or request a new one"
    );
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
    // Google just confirmed ownership of this email (checked above) —
    // that supersedes whatever the password-signup verification flow
    // had pending, including an abandoned/unverified account.
    user.isEmailVerified = true;
    await user.save();
    return issueTokens(user);
  }

  // 3. Brand-new user — Google's emailVerified check above already
  // confirms this address is real, so there's nothing for the
  // code-based flow to add here.
  user = await User.create({
    name: name || email.split("@")[0],
    email,
    googleId,
    avatar: picture || "",
    isEmailVerified: true,
  });

  return issueTokens(user);
};
