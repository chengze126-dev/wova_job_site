import { Suspense } from "react";
import { AuthShell } from "@/components/auth-shell";
import ResetPasswordForm from "./reset-password-form";

export default function ResetPasswordPage() {
  return (
    <AuthShell center action={{ href: "/login", label: "Log in" }} title="Choose a new password">
      <Suspense fallback={<p className="text-center text-sm text-muted">Loading…</p>}>
        <ResetPasswordForm />
      </Suspense>
    </AuthShell>
  );
}
