import { Suspense } from "react";
import { AuthShell } from "@/components/auth-shell";
import SignupForm from "./signup-form";

export default function SignupPage() {
  return (
    <AuthShell compact action={{ href: "/login", label: "Log in" }} title="Create account">
      <Suspense fallback={<p className="text-center text-sm text-muted">Loading…</p>}>
        <SignupForm />
      </Suspense>
    </AuthShell>
  );
}
