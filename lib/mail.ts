import { siteUrl } from "./site";

export function mailConfigured() {
  return Boolean((process.env.RESEND_API_KEY || "").trim());
}

export function emailFrom() {
  return (process.env.EMAIL_FROM || "Wova <beth.t@example.com>").trim();
}

export function usesResendTestSender() {
  return /resend\.dev/i.test(emailFrom());
}

export async function sendMail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text: string;
}) {
  const key = (process.env.RESEND_API_KEY || "").trim();
  if (!key) {
    return {
      ok: false as const,
      error: "not_configured",
      message: "Email sending is not configured. Add RESEND_API_KEY in Vercel.",
    };
  }

  const from = emailFrom();
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      html,
      text,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error("Resend failed", response.status, body);
    return {
      ok: false as const,
      error: "send_failed",
      message: humanizeResendError(response.status, body, from),
    };
  }

  return { ok: true as const };
}

function humanizeResendError(status: number, body: string, from: string) {
  let detail = body;
  try {
    const parsed = JSON.parse(body) as { message?: string };
    if (parsed.message) detail = parsed.message;
  } catch {
    /* keep raw body */
  }
  const lower = detail.toLowerCase();
  if (status === 401 || lower.includes("api key")) {
    return "RESEND_API_KEY is invalid. Check the Vercel environment variable.";
  }
  if (
    status === 403 ||
    lower.includes("not verified") ||
    lower.includes("domain") ||
    lower.includes("testing emails") ||
    lower.includes("own email")
  ) {
    if (usesResendTestSender() || /resend\.dev/i.test(from)) {
      return "Resend's test sender can only email the Resend account owner. Verify wova.cc in Resend and set EMAIL_FROM to Wova <noreply@wova.cc>.";
    }
    return `Resend rejected the sender ${from}. Verify wova.cc in Resend and set EMAIL_FROM to Wova <noreply@wova.cc>.`;
  }
  return `Could not send email (${status}). ${detail}`.slice(0, 280);
}

export function verifyEmailContent({
  name,
  code,
  verifyUrl,
}: {
  name: string;
  code: string;
  verifyUrl: string;
}) {
  const origin = siteUrl();
  const text = `Hi ${name},

Confirm your Wova email with this 6-digit code: ${code}

Or open this link: ${verifyUrl}

The code expires in 24 hours.

${origin}
`;

  const html = `<!doctype html>
<html>
  <body style="margin:0;background:#f6f7f4;font-family:Arial,sans-serif;color:#111;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;padding:32px;border:1px solid #e6e8e3;">
            <tr><td style="font-size:13px;font-weight:700;letter-spacing:0.16em;color:#0db64b;text-transform:uppercase;">Wova</td></tr>
            <tr><td style="padding-top:12px;font-size:24px;font-weight:700;">Verify your email</td></tr>
            <tr><td style="padding-top:12px;font-size:15px;line-height:1.6;color:#444;">Hi ${escapeHtml(name)}, use this code to confirm your account:</td></tr>
            <tr><td style="padding-top:20px;font-size:32px;font-weight:700;letter-spacing:0.28em;">${escapeHtml(code)}</td></tr>
            <tr><td style="padding-top:24px;">
              <a href="${escapeHtml(verifyUrl)}" style="display:inline-block;background:#0db64b;color:#fff;text-decoration:none;font-weight:700;border-radius:999px;padding:12px 22px;">Verify email</a>
            </td></tr>
            <tr><td style="padding-top:20px;font-size:13px;line-height:1.6;color:#666;">The code expires in 24 hours. If you did not create a Wova account, ignore this email.</td></tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { subject: "Verify your Wova email", html, text };
}

export function resetPasswordContent({ name, resetUrl }: { name: string; resetUrl: string }) {
  const origin = siteUrl();
  const text = `Hi ${name},

Reset your Wova password with this link:
${resetUrl}

This link expires in 1 hour. If you did not ask to reset your password, ignore this email.

${origin}
`;

  const html = `<!doctype html>
<html>
  <body style="margin:0;background:#f6f7f4;font-family:Arial,sans-serif;color:#111;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;padding:32px;border:1px solid #e6e8e3;">
            <tr><td style="font-size:13px;font-weight:700;letter-spacing:0.16em;color:#0db64b;text-transform:uppercase;">Wova</td></tr>
            <tr><td style="padding-top:12px;font-size:24px;font-weight:700;">Reset your password</td></tr>
            <tr><td style="padding-top:12px;font-size:15px;line-height:1.6;color:#444;">Hi ${escapeHtml(name)}, use this button to choose a new password. The link expires in 1 hour.</td></tr>
            <tr><td style="padding-top:24px;">
              <a href="${escapeHtml(resetUrl)}" style="display:inline-block;background:#0db64b;color:#fff;text-decoration:none;font-weight:700;border-radius:999px;padding:12px 22px;">Choose a new password</a>
            </td></tr>
            <tr><td style="padding-top:20px;font-size:13px;line-height:1.6;color:#666;">If you did not ask to reset your password, ignore this email.</td></tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { subject: "Reset your Wova password", html, text };
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
