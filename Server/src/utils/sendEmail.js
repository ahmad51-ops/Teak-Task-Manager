import { Resend } from "resend";
import { env, isEmailVerificationEnabled } from "../config/env.js";

// Switched off Gmail SMTP after confirming via Render's own logs that
// outbound SMTP is unusable on this host — first ENETUNREACH (fixed by
// forcing IPv4 in server.js), then a hard connection timeout on port
// 465 regardless. That's the signature of the platform blocking
// outbound SMTP ports outright (standard anti-spam-abuse practice on
// free hosting tiers), not a credentials or routing problem — no SMTP
// provider would have worked here. Resend's API rides over plain
// HTTPS instead, which isn't subject to that block.
const resend = isEmailVerificationEnabled ? new Resend(env.email.resendApiKey) : null;

export const sendVerificationEmail = async (to, code) => {
  // Callers only invoke this when isEmailVerificationEnabled is already
  // true (see authService.js) — this guard is just defense in depth.
  if (!resend) return;

  // resend.emails.send() resolves with { data, error } rather than
  // rejecting on failure — throwing here keeps the existing
  // .catch(...) in authService.js's fire-and-forget call working the
  // same way it did for nodemailer.
  const { error } = await resend.emails.send({
    from: `Team Task Manager <${env.email.from}>`,
    to,
    subject: "Verify your email — Team Task Manager",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #131720;">Confirm your email</h2>
        <p>Enter this code to finish creating your account:</p>
        <p style="font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #131720;">${code}</p>
        <p style="color: #8891A3; font-size: 13px;">This code expires in 15 minutes. If you didn't request this, you can ignore this email.</p>
      </div>
    `,
  });

  if (error) {
    throw new Error(error.message || "Resend API error");
  }
};
