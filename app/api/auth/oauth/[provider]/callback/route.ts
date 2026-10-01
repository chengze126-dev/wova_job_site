import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { redirect, unstable_rethrow } from "next/navigation";
import { exchangeOAuthCode, fetchOAuthProfile, type OAuthProvider } from "@/lib/oauth";
import { completeOAuthSignIn } from "@/app/actions/auth";

export const runtime = "nodejs";

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value) throw new Error("AUTH_SECRET is not set");
  return new TextEncoder().encode(value);
}

const PROVIDERS = new Set<OAuthProvider>(["github", "linkedin", "google"]);

export async function GET(request: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  const url = new URL(request.url);
  const error = url.searchParams.get("error_description") || url.searchParams.get("error");
  if (error) {
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error)}`, request.url));
  }
  if (!PROVIDERS.has(provider as OAuthProvider)) {
    return NextResponse.redirect(new URL("/login?error=oauth", request.url));
  }
  const code = url.searchParams.get("code") || "";
  const state = url.searchParams.get("state") || "";
  if (!code || !state) {
    return NextResponse.redirect(new URL("/login?error=oauth", request.url));
  }

  try {
    const { payload } = await jwtVerify(state, secret());
    if (payload.purpose !== "oauth" || payload.provider !== provider) {
      return NextResponse.redirect(new URL("/login?error=oauth", request.url));
    }
    const token = await exchangeOAuthCode(provider as OAuthProvider, code);
    const profile = await fetchOAuthProfile(provider as OAuthProvider, token);
    await completeOAuthSignIn({
      profile,
      role: payload.role === "CLIENT" ? "CLIENT" : "TALENT",
    });
    redirect("/onboarding");
  } catch (caught) {
    unstable_rethrow(caught);
    const message = caught instanceof Error ? caught.message : "Could not finish social sign-in.";
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(message)}`, request.url));
  }
}
