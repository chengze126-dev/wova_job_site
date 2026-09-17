"use client";

import { useState } from "react";
import { sendPhoneOtp, verifyPhoneOtp } from "@/app/actions/auth";
import { SubmitButton } from "@/components/submit-button";

export default function VerifyPhonePage() {
  const [demo, setDemo] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  async function send() {
    setSendError(null);
    const result = await sendPhoneOtp();
    if (result.error) setSendError(result.error);
    else setDemo(result.message || null);
  }

  async function verify(formData: FormData) {
    setVerifyError(null);
    const result = await verifyPhoneOtp(formData);
    if (result?.error) setVerifyError(result.error);
  }

  return (
    <div className="mx-auto max-w-md px-5 py-16">
      <p className="text-xs uppercase tracking-[0.24em] text-pine">Phone verify</p>
      <h1 className="font-display mt-2 text-4xl">Confirm your number</h1>
      <p className="mt-3 text-sm leading-6 text-muted">
        Confirm the number on your profile. In this demo, the code is shown on screen instead of SMS.
      </p>
      <div className="mt-8 space-y-4 rounded-2xl border border-line bg-cream p-6">
        <button
          type="button"
          onClick={send}
          className="w-full rounded-full border border-ink/20 px-5 py-2.5 text-sm hover:border-copper"
        >
          Send verification code
        </button>
        {sendError ? <p className="text-sm text-copper-dark">{sendError}</p> : null}
        {demo ? <p className="rounded-xl bg-pine/10 px-3 py-2 text-sm text-pine">{demo}</p> : null}
        <form action={verify} className="space-y-3">
          {verifyError ? <p className="text-sm text-copper-dark">{verifyError}</p> : null}
          <label className="block text-sm">
            6-digit code
            <input
              name="code"
              inputMode="numeric"
              maxLength={6}
              className="mt-1 w-full rounded-xl border border-line bg-paper px-3 py-2 tracking-[0.4em]"
            />
          </label>
          <SubmitButton className="w-full">Verify phone</SubmitButton>
        </form>
      </div>
    </div>
  );
}
