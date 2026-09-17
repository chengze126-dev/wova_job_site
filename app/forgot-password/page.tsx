"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestPasswordReset } from "@/app/actions/auth";
import { AuthError, AuthField, AuthShell, AuthSubmit, authInputClass } from "@/components/auth-shell";

export default function ForgotPasswordPage() {
  const [state, action] = useActionState(
    async (_prev: { error?: string; ok?: boolean; message?: string } | null, formData: FormData) =>
      requestPasswordReset(formData),
    null,
  );

  return (
    <AuthShell center action={{ href: "/login", label: "Log in" }} title="Reset access">
      <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#0db64b]">Account</p>
      <h1 className="mt-2 text-[26px] font-bold tracking-[-0.035em] text-ink">Reset your password</h1>
      <p className="mt-2 text-[13px] leading-6 text-muted">
        Enter the email on your Wova account. If it exists, we’ll send reset instructions.
      </p>

      {state?.ok ? (
        <p className="mt-6 rounded-[8px] bg-brand/10 px-4 py-3 text-[13px] text-pine">{state.message}</p>
      ) : (
        <form action={action} className="mt-6 space-y-3.5">
          <AuthError message={state?.error} />
          <AuthField label="Email">
            <input name="email" type="email" required autoComplete="email" className={authInputClass} />
          </AuthField>
          <AuthSubmit>Send reset link</AuthSubmit>
        </form>
      )}

      <p className="mt-5 text-center text-[13px]">
        <Link href="/login" className="font-semibold text-[#0db64b] hover:underline">
          Back to login
        </Link>
      </p>
    </AuthShell>
  );
}
