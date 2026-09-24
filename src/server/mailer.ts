import "server-only";
import nodemailer, { Transporter } from "nodemailer";

/**
 * Outgoing email over SMTP (configured through the SMTP_* env vars - see
 * .env.example). When `SMTP_HOST` isn't set, emails aren't sent at all:
 * the message (including any links) is printed to the server console
 * instead, so the forgot-password flow still works in local development
 * without a mail account.
 */

let transporter: Transporter | undefined;

function getTransporter(): Transporter | null {
  if (!process.env.SMTP_HOST) return null;
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT || 587);
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      // true for 465 (implicit TLS), false for 587/25 (STARTTLS upgrade).
      secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : port === 465,
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    });
  }
  return transporter;
}

export interface Mail {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export async function sendMail(mail: Mail): Promise<void> {
  const transport = getTransporter();
  if (!transport) {
    console.info(
      `\n[mail] SMTP_HOST is not set - printing the email instead of sending it.\n` +
        `  To:      ${mail.to}\n  Subject: ${mail.subject}\n\n${mail.text}\n`
    );
    return;
  }

  await transport.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to: mail.to,
    subject: mail.subject,
    text: mail.text,
    html: mail.html,
  });
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

export function passwordResetMail(to: string, displayName: string, link: string, validMinutes: number): Mail {
  const name = displayName || "adventurer";
  return {
    to,
    subject: "Reset your Character Sheet password",
    text:
      `Hi ${name},\n\n` +
      `Someone (hopefully you) asked to reset the password for your Character Sheet account.\n\n` +
      `Open this link to choose a new password (valid for ${validMinutes} minutes, single use):\n${link}\n\n` +
      `If you didn't ask for this, you can ignore this email - your password stays the same.\n`,
    html:
      `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#222;line-height:1.5">` +
      `<p>Hi ${escapeHtml(name)},</p>` +
      `<p>Someone (hopefully you) asked to reset the password for your Character Sheet account.</p>` +
      `<p><a href="${escapeHtml(link)}" style="display:inline-block;padding:10px 18px;background:#e78b48;color:#0a1d2b;border-radius:8px;text-decoration:none;font-weight:bold">Choose a new password</a></p>` +
      `<p style="font-size:13px;color:#555">The link is valid for ${validMinutes} minutes and works once. If the button doesn't work, paste this into your browser:<br>${escapeHtml(link)}</p>` +
      `<p style="font-size:13px;color:#555">If you didn't ask for this, you can ignore this email - your password stays the same.</p>` +
      `</div>`,
  };
}
