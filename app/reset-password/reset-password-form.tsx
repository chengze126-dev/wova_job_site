"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { resetPassword } from "@/app/actions/auth";
import { AuthError, AuthField, AuthSubmit, authInputClass } from "@/components/auth-shell";

export default function ResetPasswordForm() {
  const params = useSearchParams();
  const token = params.get("token") || "";
  const [state, action] = useActionState(
    async (_prev: { error?: string; ok?: boolean } | null, formData: FormData) => resetPassword(formData),
    null,
  );

  return (
    <div>
      <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#0db64b]">Account</p>
      <h1 className="mt-2 text-[26px] font-bold tracking-[-0.035em] text-ink">Choose a new password</h1>
      <p className="mt-2 text-[13px] leading-6 text-muted">
        Use the link from your email. The new password must be 8+ characters with a letter, a number, and a
        symbol.
      </p>

      {!token ? (
        <p className="mt-6 text-[13px] text-copper-dark">
          That reset link is missing.{" "}
          <Link href="/forgot-password" className="font-semibold text-[#0db64b] hover:underline">
            Request a new one
          </Link>
          .
        </p>
      ) : state?.ok ? (
        <p className="mt-6 rounded-[8px] bg-brand/10 px-4 py-3 text-[13px] text-pine">
          Password updated.{" "}
          <Link href="/login" className="font-semibold hover:underline">
            Log in
          </Link>
        </p>
      ) : (
        <form action={action} className="mt-6 space-y-3.5">
          <input type="hidden" name="token" value={token} />
          <AuthError message={state?.error} />
          <AuthField label="New password">
            <input name="password" type="password" required autoComplete="new-password" className={authInputClass} />
          </AuthField>
          <AuthSubmit>Save password</AuthSubmit>
        </form>
      )}
    </div>
  );
}
