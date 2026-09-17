import { siteUrl } from "./site";

export function mailConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}

export function emailFrom() {
  return process.env.EMAIL_FROM || "Wova <beth.t@example.com>";
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
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false as const, error: "not_configured" };

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: emailFrom(),
      to: [to],
      subject,
      html,
      text,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error("Resend failed", response.status, body);
    return { ok: false as const, error: "send_failed" };
  }

  return { ok: true as const };
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

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
