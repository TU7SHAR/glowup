/**
 * Email Service for GlowUp AI
 * Primary: Resend (if RESEND_API_KEY is set)
 * Fallback: Gmail SMTP via Nodemailer (if SMTP_HOST or SMTP_USER is set)
 *
 * This allows shipping with zero paid services — just use a Gmail account.
 */

import nodemailer from "nodemailer";

// ─── EMAIL PROVIDER SETUP ─────────────────────────────────────

let resendClient = null;
let smtpTransport = null;

/**
 * Determine which email provider to use:
 * 1. Resend (paid, recommended for production)
 * 2. Gmail SMTP / any SMTP (free fallback)
 */
function getEmailProvider() {
  // Try Resend first
  if (process.env.RESEND_API_KEY) {
    return "resend";
  }
  // Fall back to SMTP (Gmail or custom)
  if (process.env.SMTP_USER) {
    return "smtp";
  }
  throw new Error(
    "No email provider configured. Set RESEND_API_KEY or SMTP_USER/SMTP_PASSWORD in .env.local"
  );
}

/**
 * Get Resend client (lazy init)
 */
async function getResend() {
  if (!resendClient) {
    const { Resend } = await import("resend");
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

/**
 * Get SMTP transport (lazy init)
 * Defaults to Gmail SMTP settings if SMTP_HOST is not set
 */
function getSMTPTransport() {
  if (!smtpTransport) {
    const host = process.env.SMTP_HOST || "smtp.gmail.com";
    const port = parseInt(process.env.SMTP_PORT || "587");
    const secure = port === 465; // true for 465, false for 587

    smtpTransport = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD, // Gmail: use App Password (16-char)
      },
    });
  }
  return smtpTransport;
}

// ─── UNIFIED SEND FUNCTION ────────────────────────────────────

/**
 * Send an email using the configured provider (Resend or SMTP)
 * Automatically falls back to SMTP if Resend fails
 */
async function sendEmail({ to, subject, html }) {
  const from = process.env.EMAIL_FROM || process.env.SMTP_USER || "noreply@glowupai.com";
  const provider = getEmailProvider();

  // Try primary provider
  if (provider === "resend") {
    try {
      const resend = await getResend();
      const { data, error } = await resend.emails.send({
        from,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
      });

      if (error) throw error;
      console.log("[Email] Sent via Resend:", data?.id);
      return { success: true, provider: "resend", id: data?.id };
    } catch (resendError) {
      console.error("[Email] Resend failed:", resendError.message);

      // If SMTP is also configured, fall back to it
      if (process.env.SMTP_USER) {
        console.log("[Email] Falling back to SMTP...");
        return sendViaSMTP({ to, from, subject, html });
      }
      throw resendError;
    }
  }

  // SMTP primary
  return sendViaSMTP({ to, from, subject, html });
}

/**
 * Send via SMTP (Gmail or custom)
 */
async function sendViaSMTP({ to, from, subject, html }) {
  const transport = getSMTPTransport();

  try {
    const info = await transport.sendMail({
      from,
      to: Array.isArray(to) ? to.join(", ") : to,
      subject,
      html,
    });

    console.log("[Email] Sent via SMTP:", info.messageId);
    return { success: true, provider: "smtp", id: info.messageId };
  } catch (smtpError) {
    console.error("[Email] SMTP failed:", smtpError.message);
    throw smtpError;
  }
}

// ─── PUBLIC API ───────────────────────────────────────────────

/**
 * Send the glow-up report email after payment
 */
export async function sendReportEmail({ to, name, analysisId }) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return sendEmail({
    to,
    subject: "Your GlowUp AI Report is Ready! ✨",
    html: buildReportEmailHTML(name, analysisId, appUrl),
  });
}

/**
 * Send payment confirmation email
 */
export async function sendPaymentConfirmation({ to, name, plan, amount }) {
  return sendEmail({
    to,
    subject: "Payment Confirmed - GlowUp AI",
    html: buildPaymentEmailHTML(name, plan, amount),
  });
}

/**
 * Send daily reminder for 30-day challenge
 */
export async function sendDailyReminder({ to, name, dayNumber, tasks }) {
  return sendEmail({
    to,
    subject: `Day ${dayNumber}/30 - Your GlowUp Checklist 💪`,
    html: buildReminderEmailHTML(name, dayNumber, tasks),
  });
}

/**
 * Verify email configuration is working (call on startup or health check)
 */
export async function verifyEmailConfig() {
  try {
    const provider = getEmailProvider();

    if (provider === "smtp") {
      const transport = getSMTPTransport();
      await transport.verify();
      return { configured: true, provider: "smtp", verified: true };
    }

    return { configured: true, provider: "resend", verified: true };
  } catch (error) {
    return { configured: false, provider: null, error: error.message };
  }
}

// ─── EMAIL TEMPLATES ──────────────────────────────────────────

function buildReportEmailHTML(name, analysisId, appUrl) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, sans-serif; background: #0a0a0f; color: #f5f5f7; padding: 40px 20px;">
  <div style="max-width: 500px; margin: 0 auto;">
    <h1 style="background: linear-gradient(135deg, #a855f7, #ec4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-size: 28px;">
      GlowUp AI
    </h1>
    <h2 style="color: #f5f5f7; margin-top: 24px;">Hey ${name || "there"}, your report is ready! ✨</h2>
    <p style="color: #a1a1aa; line-height: 1.6;">
      Your personalized glow-up analysis has been unlocked. We've prepared specific recommendations for your hair, skin, style, and more.
    </p>
    <a href="${appUrl}/results?id=${analysisId}&unlocked=true" 
       style="display: inline-block; background: #a855f7; color: white; padding: 14px 32px; border-radius: 50px; text-decoration: none; font-weight: 600; margin: 24px 0;">
      View My Full Report →
    </a>
    <p style="color: #a1a1aa; font-size: 12px; margin-top: 32px;">
      If you have questions, reply to this email. We're here to help!
    </p>
  </div>
</body>
</html>`;
}

function buildPaymentEmailHTML(name, plan, amount) {
  const planNames = { report: "Glow-Up Report", coach: "30-Day Coach", monthly: "Monthly Premium" };
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, sans-serif; background: #0a0a0f; color: #f5f5f7; padding: 40px 20px;">
  <div style="max-width: 500px; margin: 0 auto;">
    <h1 style="background: linear-gradient(135deg, #a855f7, #ec4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-size: 28px;">
      GlowUp AI
    </h1>
    <h2 style="color: #22c55e;">Payment Confirmed ✓</h2>
    <p style="color: #a1a1aa; line-height: 1.6;">
      Hey ${name || "there"}, your payment of ₹${amount / 100} for <strong>${planNames[plan] || plan}</strong> has been confirmed.
    </p>
    <div style="background: #1a1a2e; border: 1px solid rgba(168,85,247,0.2); border-radius: 12px; padding: 20px; margin: 20px 0;">
      <p style="margin: 0; color: #a1a1aa; font-size: 14px;">Plan: <strong style="color: #f5f5f7;">${planNames[plan] || plan}</strong></p>
      <p style="margin: 8px 0 0; color: #a1a1aa; font-size: 14px;">Amount: <strong style="color: #f5f5f7;">₹${amount / 100}</strong></p>
    </div>
    <p style="color: #a1a1aa; font-size: 12px; margin-top: 32px;">
      This is an automated receipt. Questions? Just reply to this email.
    </p>
  </div>
</body>
</html>`;
}

function buildReminderEmailHTML(name, dayNumber, tasks) {
  const taskList = (tasks || []).map(t => `<li style="margin: 8px 0; color: #a1a1aa;">${t}</li>`).join("");
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, sans-serif; background: #0a0a0f; color: #f5f5f7; padding: 40px 20px;">
  <div style="max-width: 500px; margin: 0 auto;">
    <h1 style="background: linear-gradient(135deg, #a855f7, #ec4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-size: 28px;">
      GlowUp AI
    </h1>
    <h2 style="color: #f5f5f7;">Day ${dayNumber}/30 💪</h2>
    <p style="color: #a1a1aa; line-height: 1.6;">
      Hey ${name || "there"}! Here's your checklist for today:
    </p>
    <ul style="padding-left: 20px;">${taskList}</ul>
    <p style="color: #a1a1aa; font-size: 13px; margin-top: 24px;">
      Keep your streak alive! You're doing great. 🔥
    </p>
  </div>
</body>
</html>`;
}
