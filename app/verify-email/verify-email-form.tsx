"use client";

import { useEffect, useRef, useState } from "react";
import { sendEmailVerification, verifyEmailCode } from "@/app/actions/auth";
import { AuthError, AuthField, AuthSubmit, authInputClass } from "@/components/auth-shell";

type Hint = {
  email: string;
  mailReady: boolean;
  demoCode: string | null;
  verified: boolean;
  sent: boolean;
  sendError: string | null;
};

export default function VerifyEmailForm({
  hint,
  initialError,
}: {
  hint: Hint;
  initialError?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [sendError, setSendError] = useState<string | null>(hint.sendError);
  const [sendNote, setSendNote] = useState<string | null>(
    hint.demoCode
      ? `Email sending is not configured yet. Use this code: ${hint.demoCode}`
      : hint.sent
        ? `We sent a code to ${hint.email}. Check your inbox and spam folder.`
        : null,
  );
  const [verifyError, setVerifyError] = useState<string | null>(initialError || null);
  const autoSent = useRef(false);

  async function resend() {
    setBusy(true);
    setSendError(null);
    setVerifyError(null);
    try {
      const result = await sendEmailVerification();
      if (result && "demoCode" in result && result.demoCode) {
        setSendNote(`Email sending is not configured yet. Use this code: ${result.demoCode}`);
        if ("error" in result && result.error) setSendError(result.error);
        return;
      }
      if (result && "error" in result && result.error) {
        setSendError(result.error);
        return;
      }
      if (result && "sent" in result && result.sent) {
        setSendNote(`A new email was sent to ${hint.email}. Check your inbox and spam folder.`);
        return;
      }
      setSendNote("Send a new code, then check your inbox.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (autoSent.current) return;
    if (hint.demoCode || hint.sent || !hint.mailReady || hint.sendError) return;
    autoSent.current = true;
    void resend();
  }, [hint.demoCode, hint.sent, hint.mailReady, hint.sendError]);

  async function verify(formData: FormData) {
    setVerifyError(null);
    const result = await verifyEmailCode(formData);
    if (result?.error) setVerifyError(result.error);
  }

  return (
    <div>
      <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#0db64b]">Email verify</p>
      <h1 className="mt-2 text-[26px] font-bold tracking-[-0.035em] text-ink">Confirm your email</h1>
      <p className="mt-2 text-[13px] leading-6 text-muted">
        {hint.sent || hint.demoCode ? (
          <>
            Enter the 6-digit code we sent to <span className="font-semibold text-ink">{hint.email || "your inbox"}</span>
            , or open the link in that email.
          </>
        ) : (
          <>
            We will email a 6-digit code to <span className="font-semibold text-ink">{hint.email || "your inbox"}</span>
            . Use that code, or open the link in the email.
          </>
        )}
      </p>

      <div className="mt-6 space-y-3.5">
        <AuthError message={sendError || verifyError} />
        {sendNote ? <p className="rounded-[8px] bg-brand/10 px-4 py-3 text-[13px] text-pine">{sendNote}</p> : null}

        <form action={verify} className="space-y-3.5">
          <AuthField label="6-digit code">
            <input
              name="code"
              inputMode="numeric"
              maxLength={6}
              autoComplete="one-time-code"
              className={`${authInputClass} tracking-[0.4em]`}
            />
          </AuthField>
          <AuthSubmit>Verify email</AuthSubmit>
        </form>

        <button
          type="button"
          onClick={resend}
          disabled={busy}
          className="w-full rounded-[8px] border border-line px-4 py-2.5 text-[13px] font-semibold text-ink hover:border-[#0db64b]/40 disabled:opacity-60"
        >
          {busy ? "Sending…" : "Send code"}
        </button>
      </div>
    </div>
  );
}
