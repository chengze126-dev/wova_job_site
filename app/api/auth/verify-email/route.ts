import { redirect } from "next/navigation";
import { consumeEmailVerifyToken } from "@/app/actions/auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token") || "";
  if (!token) redirect("/verify-email");
  const result = await consumeEmailVerifyToken(token);
  if (result?.error) {
    redirect(`/verify-email?error=${encodeURIComponent(result.error)}`);
  }
  redirect("/verify-email");
}
