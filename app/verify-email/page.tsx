import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth-shell";
import { getCurrentUser } from "@/lib/auth";
import { consumeEmailVerifyToken, peekEmailVerifyHint } from "@/app/actions/auth";
import VerifyEmailForm from "./verify-email-form";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const query = await searchParams;
  if (query.token) {
    const result = await consumeEmailVerifyToken(query.token);
    const hint = await peekEmailVerifyHint();
    return (
      <AuthShell center action={{ href: "/login", label: "Log in" }} title="Verify email">
        <VerifyEmailForm hint={hint} initialError={result?.error} />
      </AuthShell>
    );
  }

  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.emailVerified) {
    if (user.role === "ADMIN") redirect("/admin");
    if (!user.onboardingDone) redirect("/onboarding");
    if (user.role === "TALENT") redirect("/dashboard");
    redirect("/");
  }

  const hint = await peekEmailVerifyHint();
  return (
    <AuthShell center action={{ href: "/login", label: "Log in" }} title="Verify email">
      <VerifyEmailForm hint={hint} />
    </AuthShell>
  );
}
