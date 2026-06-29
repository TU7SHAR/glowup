/**
 * Email Service using Resend
 * Sends glow-up reports and notifications
 */

import { Resend } from "resend";

let resendClient = null;

function getResend() {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error("RESEND_API_KEY not configured");
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

/**
 * Send the glow-up report email after payment
 */
export async function sendReportEmail({ to, name, analysisId }) {
  const resend = getResend();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM || "GlowUp AI <noreply@glowupai.com>",
    to: [to],
    subject: "Your GlowUp AI Report is Ready! ✨",
    html: buildReportEmailHTML(name, analysisId, appUrl),
  });

  if (error) {
    console.error("[Email] Failed to send report:", error);
    throw error;
  }

  return data;
}

/**
 * Send payment confirmation email
 */
export async function sendPaymentConfirmation({ to, name, plan, amount }) {
  const resend = getResend();

  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM || "GlowUp AI <noreply@glowupai.com>",
    to: [to],
    subject: "Payment Confirmed - GlowUp AI",
    html: buildPaymentEmailHTML(name, plan, amount),
  });

  if (error) {
    console.error("[Email] Failed to send confirmation:", error);
    throw error;
  }
  return data;
}



/**
 * Send daily reminder for 30-day challenge
 */
export async function sendDailyReminder({ to, name, dayNumber, tasks }) {
  const resend = getResend();

  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM || "GlowUp AI <noreply@glowupai.com>",
    to: [to],
    subject: `Day ${dayNumber}/30 - Your GlowUp Checklist 💪`,
    html: buildReminderEmailHTML(name, dayNumber, tasks),
  });

  if (error) {
    console.error("[Email] Failed to send reminder:", error);
    throw error;
  }
  return data;
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
