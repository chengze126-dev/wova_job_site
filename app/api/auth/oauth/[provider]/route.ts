import { NextResponse } from "next/server";
import { SignJWT } from "jose";
import { oauthCallbackUrl, oauthProviders, type OAuthProvider } from "@/lib/oauth";

export const runtime = "nodejs";

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value) throw new Error("AUTH_SECRET is not set");
  return new TextEncoder().encode(value);
}

const PROVIDERS = new Set<OAuthProvider>(["github", "linkedin", "google"]);

export async function GET(request: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  if (!PROVIDERS.has(provider as OAuthProvider)) {
    return NextResponse.redirect(new URL("/login?error=oauth", request.url));
  }
  const key = provider as OAuthProvider;
  const config = oauthProviders()[key];
  const requested = new URL(request.url).searchParams.get("role");
  if (requested === "CLIENT") {
    return NextResponse.redirect(
      new URL(`/signup?role=CLIENT&error=${encodeURIComponent("Employers create an account with email.")}`, request.url),
    );
  }
  const role = "TALENT";
  if (!config) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(`${key} sign-in is not configured yet.`)}`, request.url),
    );
  }
  const state = await new SignJWT({ purpose: "oauth", provider: key, role })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("15m")
    .sign(secret());
  const url = new URL(config.auth);
  url.searchParams.set("client_id", config.id);
  url.searchParams.set("redirect_uri", oauthCallbackUrl(key));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", config.scope);
  url.searchParams.set("state", state);
  if (key === "google") url.searchParams.set("prompt", "select_account");
  return NextResponse.redirect(url);
}
