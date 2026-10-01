import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth-shell";
import { getCurrentUser, getSession } from "@/lib/auth";
import { peekEmailVerifyHint } from "@/app/actions/auth";
import VerifyEmailForm from "./verify-email-form";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const query = await searchParams;
  if (query.token) {
    redirect(`/api/auth/verify-email?token=${encodeURIComponent(query.token)}`);
  }

  const user = await getCurrentUser();
  const session = user ? null : await getSession();
  if (!user && !session) redirect("/login");
  if (user?.emailVerified) {
    if (user.role === "ADMIN") redirect("/admin");
    if (!user.onboardingDone) redirect("/onboarding");
    if (user.role === "TALENT") redirect("/dashboard");
    redirect("/");
  }

  const hint = await peekEmailVerifyHint();
  return (
    <AuthShell center action={{ href: "/login", label: "Log in" }} title="Verify email">
      <VerifyEmailForm hint={hint} initialError={query.error} />
    </AuthShell>
  );
}
