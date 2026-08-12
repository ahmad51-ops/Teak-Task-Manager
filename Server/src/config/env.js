import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || "development",
  mongoUri: process.env.MONGO_URI,
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpires: process.env.JWT_ACCESS_EXPIRES || "15m",
    refreshExpires: process.env.JWT_REFRESH_EXPIRES || "7d",
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
  },
  email: {
    resendApiKey: process.env.RESEND_API_KEY,
    // Resend's shared address — works with zero setup, but only for
    // sending TO the email you signed up to Resend with. Verifying a
    // real domain (Resend dashboard) lifts that and lets this be a
    // proper "yourapp.com" address too — see sendEmail.js.
    from: process.env.EMAIL_FROM || "onboarding@resend.dev",
  },
};

const required = ["mongoUri"];
for (const key of required) {
  if (!env[key]) {
    throw new Error(`Missing required environment variable for: ${key}`);
  }
}

if (!env.jwt.accessSecret || !env.jwt.refreshSecret) {
  throw new Error("Missing required environment variable for: JWT_ACCESS_SECRET / JWT_REFRESH_SECRET");
}

if (!env.cloudinary.cloudName || !env.cloudinary.apiKey || !env.cloudinary.apiSecret) {
  throw new Error(
    "Missing required environment variable for: CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET"
  );
}

// Google is deliberately NOT in the required list — the app is fully
// usable with email/password alone. Rather than crash on boot for
// something optional, this warns once and the /auth/google endpoint
// returns a clear 503 if anyone actually tries to use it.
export const isGoogleAuthEnabled = Boolean(env.google.clientId);
if (!isGoogleAuthEnabled && env.nodeEnv === "development") {
  console.warn(
    "GOOGLE_CLIENT_ID not set — Google sign-in is disabled. Email/password login still works."
  );
}

// Same "optional, warn, degrade gracefully" treatment as Google above —
// deliberately NOT in the required list. Without it, new accounts skip
// straight to isEmailVerified: true (today's behavior) instead of the
// server crashing on boot or registration erroring for everyone.
export const isEmailVerificationEnabled = Boolean(env.email.resendApiKey);
if (!isEmailVerificationEnabled) {
  console.warn(
    "RESEND_API_KEY not set — email verification is disabled. New accounts are auto-verified."
  );
}
