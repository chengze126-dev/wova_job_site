import { AuthShell } from "@/components/auth-shell";
import LoginForm from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const query = await searchParams;
  return (
    <AuthShell center action={{ href: "/signup", label: "Sign up" }} title="Log in">
      <LoginForm oauthError={query.error} />
    </AuthShell>
  );
}
