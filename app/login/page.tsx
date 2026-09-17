import { AuthShell } from "@/components/auth-shell";
import LoginForm from "./login-form";

export default function LoginPage() {
  return (
    <AuthShell center action={{ href: "/signup", label: "Sign up" }} title="Log in">
      <LoginForm />
    </AuthShell>
  );
}
