"use client";

import { useState } from "react";
import { sendEmailVerification, verifyEmailCode } from "@/app/actions/auth";
import { AuthError, AuthField, AuthSubmit, authInputClass } from "@/components/auth-shell";

export default function VerifyEmailForm({
  hint,
  initialError,
}: {
  hint: { email: string; mailReady: boolean; demoCode: string | null; verified: boolean };
  initialError?: string;
}) {
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendNote, setSendNote] = useState<string | null>(
    hint.demoCode
      ? `Email sending is not configured yet. Use this code: ${hint.demoCode}`
      : hint.mailReady
        ? `We sent a code to ${hint.email}.`
        : null,
  );
  const [verifyError, setVerifyError] = useState<string | null>(initialError || null);

  async function resend() {
    setSendError(null);
    setVerifyError(null);
    const result = await sendEmailVerification();
    if (result && "error" in result && result.error) {
      setSendError(result.error);
      return;
    }
    if (result && "sent" in result && result.sent) {
      setSendNote(`A new email was sent to ${hint.email}.`);
      return;
    }
    if (result && "demoCode" in result && result.demoCode) {
      setSendNote(`Email sending is not configured yet. Use this code: ${result.demoCode}`);
      return;
    }
    setSendNote("Send a new code, then check your inbox.");
  }

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
        Enter the 6-digit code we sent to <span className="font-semibold text-ink">{hint.email || "your inbox"}</span>
        , or open the link in that email.
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
          className="w-full rounded-[8px] border border-line px-4 py-2.5 text-[13px] font-semibold text-ink hover:border-[#0db64b]/40"
        >
          Send code
        </button>
      </div>
    </div>
  );
}
