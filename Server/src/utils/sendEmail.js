import nodemailer from "nodemailer";
import { env, isEmailVerificationEnabled } from "../config/env.js";

// Gmail SMTP via an App Password (not the account password — requires
// 2-Step Verification enabled on the Google account, then a 16-char
// app password generated at myaccount.google.com/apppasswords). Good
// enough for this app's volume; a dedicated transactional email
// provider would be the move if sending volume ever became a problem.
const transporter = isEmailVerificationEnabled
  ? nodemailer.createTransport({
      service: "gmail",
      auth: { user: env.email.user, pass: env.email.appPassword },
    })
  : null;

export const sendVerificationEmail = async (to, code) => {
  // Callers only invoke this when isEmailVerificationEnabled is already
  // true (see authService.js) — this guard is just defense in depth.
  if (!transporter) return;

  await transporter.sendMail({
    from: `"Team Task Manager" <${env.email.user}>`,
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
};
