import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { isAdminEmail } from "@/lib/admin";

const AUTH_PREFIXES = [
  "/onboarding",
  "/verify-phone",
  "/skill-test",
  "/messages",
  "/connects",
  "/billing",
  "/admin",
  "/profile",
];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const needsAuth =
    AUTH_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`)) || pathname === "/jobs/new";

  if (!needsAuth) return NextResponse.next();

  const token = req.cookies.get("hireline_session")?.value;
  const login = new URL("/login", req.url);
  login.searchParams.set("next", pathname);

  if (!token || !process.env.AUTH_SECRET) {
    return NextResponse.redirect(login);
  }

  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(process.env.AUTH_SECRET));
    if (pathname.startsWith("/admin") && (payload.role !== "ADMIN" || !isAdminEmail(String(payload.email || "")))) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    if (payload.emailVerified === false && pathname !== "/verify-email") {
      return NextResponse.redirect(new URL("/verify-email", req.url));
    }
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(login);
  }
}

export const config = {
  matcher: [
    "/onboarding/:path*",
    "/verify-phone/:path*",
    "/skill-test/:path*",
    "/messages/:path*",
    "/connects/:path*",
    "/billing/:path*",
    "/admin/:path*",
    "/profile/:path*",
    "/jobs/new",
  ],
};
