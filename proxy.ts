import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { SITE_HOST } from "@/lib/site";

const AUTH_PREFIXES = [
  "/dashboard",
  "/onboarding",
  "/verify-phone",
  "/skill-test",
  "/messages",
  "/connects",
  "/billing",
  "/admin",
  "/profile",
];

function hostname(req: NextRequest) {
  return (req.headers.get("host") || req.nextUrl.hostname || "").split(":")[0].toLowerCase();
}

function canonicalRedirect(req: NextRequest) {
  const host = hostname(req);
  if (host !== "wova.cc") return null;
  const url = req.nextUrl.clone();
  url.hostname = SITE_HOST;
  url.port = "";
  url.protocol = "https:";
  return NextResponse.redirect(url, 308);
}

export async function proxy(req: NextRequest) {
  const redirect = canonicalRedirect(req);
  if (redirect) return redirect;

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
    if (pathname.startsWith("/admin") && payload.role !== "ADMIN") {
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
    "/((?!_next/static|_next/image|uploads/|.*\\.(?:ico|png|jpg|jpeg|gif|webp|svg|mp4)$).*)",
  ],
};
