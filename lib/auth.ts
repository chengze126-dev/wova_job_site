import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma, type User } from "./prisma";
import { parseExtras, stringifyExtras } from "./profile-extras";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "CLIENT" | "TALENT";
  emailVerified: boolean;
};

export type SignupSnapshot = {
  id: string;
  email: string;
  name: string;
  role: string;
  country: string | null;
  passwordHash: string;
  emailVerified: boolean;
  title?: string | null;
  bio?: string | null;
  phone?: string | null;
  linkedinUrl?: string | null;
  hourlyRate?: number | null;
  skills?: string | null;
  city?: string | null;
  githubUrl?: string | null;
  hoursPerWeek?: string | null;
  stackoverflowUrl?: string | null;
  availableNow?: boolean;
  onboardingDone?: boolean;
  companyName?: string | null;
  companyLocation?: string | null;
};

export function snapshotFromUser(user: {
  id: string;
  email: string;
  name: string;
  role: string;
  country: string | null;
  passwordHash: string;
  emailVerified: boolean;
  title?: string | null;
  bio?: string | null;
  phone?: string | null;
  linkedinUrl?: string | null;
  hourlyRate?: number | null;
  skills?: string | null;
  extras?: string | null;
  onboardingDone?: boolean;
  companyName?: string | null;
  companyLocation?: string | null;
}): SignupSnapshot {
  const extras = parseExtras(user.extras);
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    country: user.country,
    passwordHash: user.passwordHash,
    emailVerified: user.emailVerified,
    title: user.title,
    bio: user.bio ? user.bio.slice(0, 1500) : null,
    phone: user.phone,
    linkedinUrl: user.linkedinUrl,
    hourlyRate: user.hourlyRate,
    skills: user.skills,
    city: extras.city,
    githubUrl: extras.githubUrl,
    hoursPerWeek: extras.hoursPerWeek,
    stackoverflowUrl: extras.stackoverflowUrl,
    availableNow: extras.availableNow,
    onboardingDone: user.onboardingDone,
    companyName: user.companyName,
    companyLocation: user.companyLocation,
  };
}

export function toSessionUser(user: {
  id: string;
  email: string;
  name: string;
  role: string;
  emailVerified?: boolean;
}): SessionUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as SessionUser["role"],
    emailVerified: Boolean(user.emailVerified),
  };
}

export const AUTH_COOKIES = {
  session: "hireline_session",
  signup: "wova_signup",
  otp: "wova_email_otp",
  verifyStatus: "wova_verify_status",
  verifyHint: "wova_verify_hint",
} as const;

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value) throw new Error("AUTH_SECRET is not set");
  return new TextEncoder().encode(value);
}

function cookieDomain(): string | undefined {
  if (process.env.VERCEL_ENV !== "production") return undefined;
  return ".wova.cc";
}

export function authCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production" || Boolean(process.env.VERCEL),
    path: "/",
    maxAge,
    ...(cookieDomain() ? { domain: cookieDomain() } : {}),
  };
}

export async function clearCookie(name: string) {
  const jar = await cookies();
  const expired = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production" || Boolean(process.env.VERCEL),
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  };
  try {
    jar.delete(name);
  } catch {
    /* older cookie stores only support set */
  }
  jar.set(name, "", expired);
  jar.set(name, "", { ...expired, domain: ".wova.cc" });
}

export async function createSession(user: SessionUser, options?: { remember?: boolean }) {
  const days = options?.remember ? 30 : 7;
  const token = await new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${days}d`)
    .sign(secret());

  (await cookies()).set(AUTH_COOKIES.session, token, authCookieOptions(60 * 60 * 24 * days));
}

export async function rememberSignup(user: SignupSnapshot) {
  const token = await new SignJWT({ purpose: "signup-snapshot", ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setExpirationTime("30d")
    .sign(secret());
  (await cookies()).set(AUTH_COOKIES.signup, token, authCookieOptions(60 * 60 * 24 * 30));
}

export async function readSignupSnapshot(): Promise<SignupSnapshot | null> {
  const token = (await cookies()).get(AUTH_COOKIES.signup)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (payload.purpose !== "signup-snapshot" || !payload.id || !payload.email || !payload.passwordHash) {
      return null;
    }
    return {
      id: String(payload.id),
      email: String(payload.email).toLowerCase(),
      name: String(payload.name || ""),
      role: String(payload.role || "TALENT"),
      country: payload.country ? String(payload.country) : null,
      passwordHash: String(payload.passwordHash),
      emailVerified: payload.emailVerified === true,
      title: payload.title ? String(payload.title) : null,
      bio: payload.bio ? String(payload.bio) : null,
      phone: payload.phone ? String(payload.phone) : null,
      linkedinUrl: payload.linkedinUrl ? String(payload.linkedinUrl) : null,
      hourlyRate: payload.hourlyRate == null ? null : Number(payload.hourlyRate),
      skills: payload.skills ? String(payload.skills) : null,
      city: payload.city ? String(payload.city) : null,
      githubUrl: payload.githubUrl ? String(payload.githubUrl) : null,
      hoursPerWeek: payload.hoursPerWeek ? String(payload.hoursPerWeek) : null,
      stackoverflowUrl: payload.stackoverflowUrl ? String(payload.stackoverflowUrl) : null,
      availableNow: payload.availableNow === true,
      onboardingDone: payload.onboardingDone === true,
      companyName: payload.companyName ? String(payload.companyName) : null,
      companyLocation: payload.companyLocation ? String(payload.companyLocation) : null,
    };
  } catch {
    return null;
  }
}

export async function restoreUserFromSnapshot(session: SessionUser): Promise<User | null> {
  const snapshot = await readSignupSnapshot();
  if (!snapshot || snapshot.id !== session.id) return null;

  const extras = stringifyExtras({
    ...parseExtras(null),
    city: snapshot.city || undefined,
    githubUrl: snapshot.githubUrl || undefined,
    hoursPerWeek: snapshot.hoursPerWeek || undefined,
    stackoverflowUrl: snapshot.stackoverflowUrl || undefined,
    availableNow: snapshot.availableNow,
  });

  const existing = await prisma.user.findUnique({ where: { id: session.id } });
  if (existing) return hydrateFromSnapshot(existing, snapshot, extras);
  const byEmail = await prisma.user.findUnique({ where: { email: snapshot.email } });
  if (byEmail) return hydrateFromSnapshot(byEmail, snapshot, extras);

  try {
    return await prisma.user.create({
      data: {
        id: snapshot.id,
        email: snapshot.email,
        name: snapshot.name,
        role: snapshot.role,
        country: snapshot.country,
        passwordHash: snapshot.passwordHash,
        emailVerified: session.emailVerified || snapshot.emailVerified,
        connects: 0,
        title: snapshot.title,
        bio: snapshot.bio,
        phone: snapshot.phone,
        linkedinUrl: snapshot.linkedinUrl,
        hourlyRate: snapshot.hourlyRate,
        skills: snapshot.skills,
        extras,
        onboardingDone: snapshot.onboardingDone,
        companyName: snapshot.companyName,
        companyLocation: snapshot.companyLocation,
      },
    });
  } catch {
    return prisma.user.findUnique({ where: { email: snapshot.email } });
  }
}

async function hydrateFromSnapshot(user: User, snapshot: SignupSnapshot, extras: string) {
  if (user.title || user.skills || user.bio) return user;
  if (!snapshot.title && !snapshot.skills && !snapshot.bio && !snapshot.city) return user;
  try {
    return await prisma.user.update({
      where: { id: user.id },
      data: {
        title: snapshot.title ?? user.title,
        bio: snapshot.bio ?? user.bio,
        phone: snapshot.phone ?? user.phone,
        linkedinUrl: snapshot.linkedinUrl ?? user.linkedinUrl,
        hourlyRate: snapshot.hourlyRate ?? user.hourlyRate,
        skills: snapshot.skills ?? user.skills,
        extras: user.extras || extras,
        country: snapshot.country ?? user.country,
        onboardingDone: snapshot.onboardingDone || user.onboardingDone,
        companyName: snapshot.companyName ?? user.companyName,
        companyLocation: snapshot.companyLocation ?? user.companyLocation,
      },
    });
  } catch {
    return user;
  }
}

export async function destroySession() {
  await Promise.all(Object.values(AUTH_COOKIES).map((name) => clearCookie(name)));
}

export async function getSession(): Promise<SessionUser | null> {
  const token = (await cookies()).get(AUTH_COOKIES.session)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (!payload.id || !payload.email || !payload.role || !payload.name) return null;
    return {
      id: String(payload.id),
      email: String(payload.email),
      name: String(payload.name),
      role: payload.role as SessionUser["role"],
      emailVerified: payload.emailVerified !== false,
    };
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;
  let user = await prisma.user.findUnique({ where: { id: session.id } });
  if (!user) user = await restoreUserFromSnapshot(session);
  if (!user) user = await prisma.user.findUnique({ where: { email: session.email.toLowerCase() } });
  if (user && session.emailVerified && !user.emailVerified) {
    try {
      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: true, emailOtpHash: null, emailOtpExpires: null },
      });
    } catch {
      /* another instance may not have this row yet */
    }
    return { ...user, emailVerified: true, emailOtpHash: null, emailOtpExpires: null };
  }
  return user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) return null;
  return user;
}
