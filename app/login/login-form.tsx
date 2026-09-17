"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { loginUser } from "@/app/actions/auth";
import { AuthDivider, AuthError, AuthField, AuthSubmit, SocialAuthButtons, authInputClass } from "@/components/auth-shell";

export default function LoginForm() {
  const [step, setStep] = useState<"email" | "password">("email");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [socialNote, setSocialNote] = useState("");
  const [state, action] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => loginUser(formData),
    null,
  );

  if (step === "email") {
    return (
      <div>
        <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#0db64b]">Welcome back</p>
        <h1 className="mt-2 text-[28px] font-bold tracking-[-0.04em] text-ink">Log in</h1>
        <p className="mt-2 text-[13px] text-muted">Use your Wova email to continue.</p>

        <div className="mt-5">
          <SocialAuthButtons
            onUnavailable={(provider) =>
              setSocialNote(`${provider} login is not enabled yet. Continue with email.`)
            }
          />
        </div>

        <div className="my-5">
          <AuthDivider />
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            const value = email.trim();
            if (!value.includes("@")) {
              setEmailError("Enter a valid email address.");
              return;
            }
            setEmailError("");
            setStep("password");
          }}
          className="space-y-3.5"
        >
          <AuthError message={emailError || socialNote} />
          <AuthField label="Email">
            <input
              type="email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className={authInputClass}
            />
          </AuthField>
          <AuthSubmit>Continue</AuthSubmit>
        </form>

        <p className="mt-5 text-center text-[13px] text-muted">
          New to Wova?{" "}
          <Link href="/signup" className="font-semibold text-[#0db64b] hover:underline">
            Create an account
          </Link>
        </p>
        <p className="mt-4 text-center text-[11px] leading-5 text-muted">
          Demo · maya@talent.test · jordan@northfield.co · Hireline123!
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#0db64b]">Welcome back</p>
      <h1 className="mt-2 text-[26px] font-bold tracking-[-0.035em] text-ink">Enter your password</h1>
      <button
        type="button"
        onClick={() => setStep("email")}
        className="mt-2 text-[13px] text-muted hover:text-ink"
      >
        {email} <span className="font-semibold text-[#0db64b]">Change</span>
      </button>

      <form action={action} className="mt-6 space-y-3.5">
        <input type="hidden" name="email" value={email} />
        <AuthError message={state?.error} />
        <AuthField label="Password">
          <input name="password" type="password" required autoComplete="current-password" className={authInputClass} />
        </AuthField>
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-[13px] text-muted">
            <input type="checkbox" name="remember" defaultChecked className="h-4 w-4 accent-[#0db64b]" />
            Stay signed in
          </label>
          <Link href="/forgot-password" className="text-[13px] font-semibold text-[#0db64b] hover:underline">
            Forgot password?
          </Link>
        </div>
        <AuthSubmit>Log in</AuthSubmit>
      </form>
    </div>
  );
}
