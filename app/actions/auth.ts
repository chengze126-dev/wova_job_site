"use server";

import { hash, compare } from "bcryptjs";
import { redirect, unstable_rethrow } from "next/navigation";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  AUTH_COOKIES,
  authCookieOptions,
  clearCookie,
  createSession,
  destroySession,
  getCurrentUser,
  getSession,
  readSignupSnapshot,
  rememberSignup,
  restoreUserFromSnapshot,
  snapshotFromUser,
  toSessionUser,
} from "@/lib/auth";
import { COMPANY_SIZES, COUNTRIES, INDUSTRIES, parseSkills } from "@/lib/constants";
import { savePublicUpload } from "@/lib/uploads";
import { revalidatePath } from "next/cache";
import { isStrongPassword } from "@/lib/password";
import { parseExtras, stringifyExtras } from "@/lib/profile-extras";
import type { OAuthProfile } from "@/lib/oauth";
import { randomBytes } from "crypto";
import { mailConfigured, sendMail, usesResendTestSender, verifyEmailContent, resetPasswordContent } from "@/lib/mail";
import { siteUrl } from "@/lib/site";
import { isAdminEmail } from "@/lib/admin";
import { isVercelProduction } from "@/lib/paths";

const registerSchema = z.object({
  firstName: z.string().trim().min(1).max(40),
  lastName: z.string().trim().min(1).max(40),
  email: z.string().email(),
  password: z.string().min(8).max(64),
  role: z.enum(["CLIENT", "TALENT"]),
  country: z.string().min(2),
  agree: z.literal("on"),
});

export async function registerUser(formData: FormData) {
  const parsed = registerSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
    country: formData.get("country"),
    agree: formData.get("agree"),
  });
  if (!parsed.success) {
    return { error: "Check your name, email, country, password, and terms agreement." };
  }
  if (!COUNTRIES.includes(parsed.data.country)) {
    return { error: "Select a valid country." };
  }
  if (!isStrongPassword(parsed.data.password)) {
    return { error: "Password must be 8+ characters and include a letter, a number, and a special character." };
  }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  if (existing || isAdminEmail(parsed.data.email)) {
    return { error: "An account with that email already exists. Log in instead." };
  }

  const name = `${parsed.data.firstName} ${parsed.data.lastName}`.trim();
  const user = await prisma.user.create({
    data: {
      name,
      email: parsed.data.email.toLowerCase(),
      passwordHash: await hash(parsed.data.password, 10),
      role: parsed.data.role,
      country: parsed.data.country,
      connects: 0,
      emailVerified: false,
    },
  });

  try {
    await rememberSignup({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      country: user.country,
      passwordHash: user.passwordHash,
      emailVerified: false,
    });
    await createSession(toSessionUser(user));
  } catch (error) {
    if (error instanceof Error && error.message.includes("AUTH_SECRET")) {
      return { error: "Server auth is not configured. Add AUTH_SECRET in Vercel environment variables." };
    }
    throw error;
  }
  await issueEmailVerification(user.id);
  redirect("/verify-email");
}

export async function loginUser(formData: FormData) {
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") || "");
  const remember = formData.get("remember") === "on";
  if (!email || !password) return { error: "Email and password are required." };

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await compare(password, user.passwordHash))) {
    return { error: "Oops! The email or password you entered is incorrect." };
  }

  try {
    await rememberSignup(snapshotFromUser(user));
    await createSession(toSessionUser(user), { remember });
  } catch (error) {
    if (error instanceof Error && error.message.includes("AUTH_SECRET")) {
      return { error: "Server auth is not configured. Add AUTH_SECRET in Vercel environment variables." };
    }
    throw error;
  }

  if (!user.emailVerified && user.role !== "ADMIN") {
    await issueEmailVerification(user.id);
    redirect("/verify-email");
  }
  if (!user.onboardingDone && user.role !== "ADMIN") redirect("/onboarding");
  if (user.role === "ADMIN") redirect("/admin");
  if (user.role === "TALENT") redirect(`/profile/${user.id}`);
  redirect("/");
}

export async function completeOAuthSignIn({
  profile,
  role,
}: {
  profile: OAuthProfile;
  role: "CLIENT" | "TALENT";
}) {
  const email = profile.email.toLowerCase();
  if (isAdminEmail(email)) {
    throw new Error("Use email and password for the admin account.");
  }
  const accountRole = role === "CLIENT" ? "CLIENT" : "TALENT";
  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        name: profile.name || "New user",
        passwordHash: await hash(randomBytes(24).toString("hex"), 10),
        role: accountRole,
        country: "United States",
        connects: 0,
        emailVerified: true,
        avatarUrl: profile.avatarUrl || null,
        linkedinUrl:
          profile.provider === "linkedin" && profile.profileUrl?.includes("linkedin.com/in/")
            ? profile.profileUrl
            : null,
      },
    });
  }

  const extras = parseExtras(user.extras);
  if (profile.provider === "github") {
    extras.githubUrl = profile.profileUrl || extras.githubUrl;
    extras.githubId = profile.id;
  }
  if (profile.provider === "linkedin") extras.linkedinId = profile.id;
  if (profile.provider === "google") extras.googleId = profile.id;

  const nextAvatar = user.avatarUrl || profile.avatarUrl || null;
  const nextLinkedin =
    user.linkedinUrl ||
    (profile.provider === "linkedin" && profile.profileUrl?.includes("linkedin.com/in/") ? profile.profileUrl : null);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      extras: stringifyExtras(extras),
      ...(nextAvatar ? { avatarUrl: nextAvatar } : {}),
      ...(nextLinkedin ? { linkedinUrl: nextLinkedin } : {}),
    },
  });
  const next = await prisma.user.findUnique({ where: { id: user.id } });
  if (!next) throw new Error("Could not finish social sign-in.");
  await rememberSignup(snapshotFromUser({ ...next, emailVerified: true }));
  await createSession(toSessionUser({ ...next, emailVerified: true }));
  continueAfterAuth({ ...next, emailVerified: true });
}

export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();
  if (!email.includes("@")) return { error: "Enter the email address for your account." };

  const generic = {
    ok: true as const,
    message: "If an account exists for that email, we sent a reset link. Check your inbox.",
  };

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return generic;

  const token = await new SignJWT({ purpose: "password-reset", id: user.id, email: user.email })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("1h")
    .sign(authSecret());
  const resetUrl = `${siteUrl()}/reset-password?token=${encodeURIComponent(token)}`;

  if (!mailConfigured()) {
    if (isVercelProduction()) {
      return { error: "Password reset email is not configured. Set RESEND_API_KEY." };
    }
    return {
      ok: true as const,
      message: `Email sending is not configured yet. Open this reset link: ${resetUrl}`,
    };
  }

  const content = resetPasswordContent({ name: user.name.split(" ")[0] || user.name, resetUrl });
  const sent = await sendMail({ to: user.email, ...content });
  if (!sent.ok) {
    if (isVercelProduction()) {
      return { error: sent.message || "Could not send the reset email. Try again." };
    }
    return {
      ok: true as const,
      message: `Email sending failed. Open this reset link: ${resetUrl}`,
    };
  }
  return generic;
}

export async function resetPassword(formData: FormData) {
  const token = String(formData.get("token") || "").trim();
  const password = String(formData.get("password") || "");
  if (!token) return { error: "That reset link is missing. Request a new one." };
  if (!isStrongPassword(password)) {
    return { error: "Password must be 8+ characters and include a letter, a number, and a special character." };
  }

  try {
    const { payload } = await jwtVerify(token, authSecret());
    if (payload.purpose !== "password-reset" || !payload.id) {
      return { error: "That link is invalid. Request a new reset email." };
    }
    const user = await prisma.user.findUnique({ where: { id: String(payload.id) } });
    if (!user || user.email !== String(payload.email || "")) {
      return { error: "That link is invalid. Request a new reset email." };
    }
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await hash(password, 10) },
    });
    return { ok: true as const };
  } catch {
    return { error: "That link expired. Request a new reset email." };
  }
}

export async function logoutUser() {
  await destroySession();
  redirect("/");
}

export async function completeTalentOnboarding(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || user.role !== "TALENT") return { error: "Only talent accounts can complete this step." };

  const linkedinUrl = String(formData.get("linkedinUrl") || "").trim() || user.linkedinUrl || "";
  const githubUrl = String(formData.get("githubUrl") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const bio = String(formData.get("bio") || "").trim();
  const title = String(formData.get("title") || "").trim();
  const hourlyRate = Number(String(formData.get("hourlyRate") || "").trim());
  const skills = parseSkills(String(formData.get("skills") || ""));
  const city = String(formData.get("city") || "").trim();
  const country = String(formData.get("country") || "").trim();
  const resume = formData.get("resume");
  const avatar = formData.get("avatar");

  if (!linkedinUrl.includes("linkedin.com")) {
    return { error: "Enter a full LinkedIn profile URL." };
  }
  if (phone.replace(/\D/g, "").length < 8) {
    return { error: "Enter a valid phone number with country code." };
  }
  if (title.length < 4) return { error: "Add a professional title, like Full-Stack Developer." };
  if (!Number.isFinite(hourlyRate) || hourlyRate < 5 || hourlyRate > 500) {
    return { error: "Enter an hourly rate between $5 and $500." };
  }
  if (skills.length < 2) return { error: "Add at least two skills." };

  if (!(avatar instanceof File) || avatar.size === 0) {
    if (!user.avatarUrl) return { error: "Upload a profile photo to continue." };
  }
  let avatarUrl = user.avatarUrl;
  if (avatar instanceof File && avatar.size > 0) {
    const avatarSaved = await savePublicUpload({
      file: avatar,
      folder: "avatars",
      userId: user.id,
      allowed: [".jpg", ".jpeg", ".png", ".webp"],
      maxBytes: 5 * 1024 * 1024,
    });
    if ("error" in avatarSaved) return { error: avatarSaved.error };
    avatarUrl = avatarSaved.url;
  }
  if (!avatarUrl) return { error: "Upload a profile photo to continue." };

  let resumeUrl = user.resumeUrl;
  if (resume instanceof File && resume.size > 0) {
    const resumeSaved = await savePublicUpload({
      file: resume,
      folder: "resumes",
      userId: user.id,
      allowed: [".pdf", ".doc", ".docx", ".txt"],
      maxBytes: 8 * 1024 * 1024,
    });
    if ("error" in resumeSaved) return { error: resumeSaved.error };
    resumeUrl = resumeSaved.url;
  }
  if (!resumeUrl) return { error: "Upload your resume to continue." };

  const extras = parseExtras(user.extras);
  extras.city = city || extras.city;
  if (githubUrl) extras.githubUrl = githubUrl;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      linkedinUrl,
      phone,
      bio,
      resumeUrl,
      avatarUrl,
      title,
      hourlyRate,
      skills: JSON.stringify(skills),
      extras: stringifyExtras(extras),
      onboardingDone: true,
      ...(country ? { country } : {}),
    },
  });
  const saved = await prisma.user.findUnique({ where: { id: user.id } });
  if (saved) await rememberSignup(snapshotFromUser(saved));

  redirect(`/profile/${user.id}`);
}

export async function completeClientOnboarding(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || user.role !== "CLIENT") return { error: "Only client accounts can complete this step." };

  const companyName = String(formData.get("companyName") || "").trim();
  const companySize = String(formData.get("companySize") || "").trim();
  const companyIndustry = String(formData.get("companyIndustry") || "").trim();
  const companyWebsite = String(formData.get("companyWebsite") || "").trim();
  const companyLocation = String(formData.get("companyLocation") || "").trim();
  const country = String(formData.get("country") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const bio = String(formData.get("bio") || "").trim();

  if (companyName.length < 2) return { error: "Company name is required." };
  if (!COMPANY_SIZES.some((s) => s.value === companySize)) return { error: "Select a company size." };
  if (!INDUSTRIES.includes(companyIndustry)) return { error: "Select an industry." };
  if (phone.replace(/\D/g, "").length < 8) return { error: "Enter a valid phone number with country code." };

  await prisma.user.update({
    where: { id: user.id },
    data: {
      companyName,
      companySize,
      companyIndustry,
      companyWebsite,
      companyLocation,
      phone,
      bio,
      onboardingDone: true,
      ...(country ? { country } : {}),
    },
  });
  const saved = await prisma.user.findUnique({ where: { id: user.id } });
  if (saved) {
    try {
      await rememberSignup(snapshotFromUser(saved));
    } catch {
      /* snapshot cookie is best-effort */
    }
  }

  redirect("/dashboard");
}

export async function updateProfile(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return { error: "Sign in first." };
  const bio = String(formData.get("bio") || "").trim();
  const name = String(formData.get("name") || "").trim();
  if (name.length < 2) return { error: "Name is required." };

  const data: Record<string, unknown> = { bio, name };
  const phone = String(formData.get("phone") || "").trim();
  const country = String(formData.get("country") || "").trim();
  const companyLocation = String(formData.get("companyLocation") || "").trim();
  if (phone && phone.replace(/\D/g, "").length < 8) {
    return { error: "Enter a valid phone number with country code." };
  }
  if (phone) data.phone = phone;
  if (country) data.country = country;
  if (companyLocation) data.companyLocation = companyLocation;
  if (user.role === "TALENT") {
    const title = String(formData.get("title") || "").trim();
    const hourlyRate = Number(String(formData.get("hourlyRate") || "").trim());
    const skills = parseSkills(String(formData.get("skills") || ""));
    if (title.length < 4) return { error: "Add a professional title." };
    if (!Number.isFinite(hourlyRate) || hourlyRate < 5 || hourlyRate > 500) {
      return { error: "Enter an hourly rate between $5 and $500." };
    }
    if (skills.length < 2) return { error: "Add at least two skills." };
    data.title = title;
    data.hourlyRate = hourlyRate;
    data.skills = JSON.stringify(skills);

    const avatar = formData.get("avatar");
    if (avatar instanceof File && avatar.size > 0) {
      const avatarSaved = await savePublicUpload({
        file: avatar,
        folder: "avatars",
        userId: user.id,
        allowed: [".jpg", ".jpeg", ".png", ".webp"],
        maxBytes: 5 * 1024 * 1024,
      });
      if ("error" in avatarSaved) return { error: avatarSaved.error };
      data.avatarUrl = avatarSaved.url;
    } else if (!user.avatarUrl) {
      return { error: "Upload a profile photo." };
    }
  }

  await prisma.user.update({ where: { id: user.id }, data });
  const saved = await prisma.user.findUnique({ where: { id: user.id } });
  if (saved) {
    try {
      await rememberSignup(snapshotFromUser(saved));
    } catch {
      /* snapshot cookie is best-effort */
    }
  }
  revalidatePath("/profile");
  revalidatePath("/profile/settings");
  revalidatePath(`/profile/${user.id}`);
  revalidatePath("/talents");
  redirect(user.role === "TALENT" ? `/profile/${user.id}` : "/profile/settings");
}

function randomOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function authSecret() {
  const value = process.env.AUTH_SECRET;
  if (!value) throw new Error("AUTH_SECRET is not set");
  return new TextEncoder().encode(value);
}

function continueAfterAuth(user: { id?: string; role: string; onboardingDone: boolean; emailVerified?: boolean }) {
  if (!user.emailVerified && user.role !== "ADMIN") redirect("/verify-email");
  if (!user.onboardingDone && user.role !== "ADMIN") redirect("/onboarding");
  if (user.role === "ADMIN") redirect("/admin");
  if (user.role === "TALENT") redirect(user.id ? `/profile/${user.id}` : "/profile");
  redirect("/");
}

type OtpPayload = { id: string; email: string; hash: string };

async function writeVerifyStatus(status: { sent: boolean; error?: string }) {
  (await cookies()).set(
    AUTH_COOKIES.verifyStatus,
    encodeURIComponent(JSON.stringify({ sent: status.sent, error: status.error || null })),
    authCookieOptions(60 * 60),
  );
}

async function readVerifyStatus(): Promise<{ sent: boolean; error: string | null }> {
  const raw = (await cookies()).get(AUTH_COOKIES.verifyStatus)?.value;
  if (!raw) return { sent: false, error: null };
  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as { sent?: boolean; error?: string | null };
    return { sent: Boolean(parsed.sent), error: parsed.error || null };
  } catch {
    return { sent: false, error: null };
  }
}

async function writeOtpCookie(user: { id: string; email: string }, otpHash: string) {
  const token = await new SignJWT({ purpose: "email-otp", id: user.id, email: user.email, hash: otpHash })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("24h")
    .sign(authSecret());
  (await cookies()).set(AUTH_COOKIES.otp, token, authCookieOptions(60 * 60 * 24));
}

async function readOtpCookie(): Promise<OtpPayload | null> {
  const token = (await cookies()).get(AUTH_COOKIES.otp)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, authSecret());
    if (payload.purpose !== "email-otp" || !payload.id || !payload.hash) return null;
    return { id: String(payload.id), email: String(payload.email || ""), hash: String(payload.hash) };
  } catch {
    return null;
  }
}

async function clearVerifyCookies() {
  await clearCookie(AUTH_COOKIES.otp);
  await clearCookie(AUTH_COOKIES.verifyHint);
  await clearCookie(AUTH_COOKIES.verifyStatus);
}

async function loadAuthUser() {
  const session = await getSession();
  let user = await getCurrentUser();
  if (!user && session) user = await restoreUserFromSnapshot(session);
  return { session, user };
}

async function markEmailVerified(user: {
  id: string;
  email: string;
  name: string;
  role: string;
  onboardingDone?: boolean;
  country?: string | null;
}) {
  try {
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true, emailOtpHash: null, emailOtpExpires: null },
    });
  } catch {
    const session = await getSession();
    if (session) {
      await restoreUserFromSnapshot({
        ...session,
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role as "ADMIN" | "CLIENT" | "TALENT",
        emailVerified: true,
      });
    }
    try {
      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: true, emailOtpHash: null, emailOtpExpires: null },
      });
    } catch {
      /* cookie session still carries emailVerified */
    }
  }
  const persisted = await prisma.user.findUnique({ where: { id: user.id } });
  const snapshot = await readSignupSnapshot();
  const passwordHash = persisted?.passwordHash || snapshot?.passwordHash || "";
  if (passwordHash) {
    await rememberSignup(
      snapshotFromUser({
        ...(persisted || user),
        passwordHash,
        emailVerified: true,
        country: persisted?.country ?? snapshot?.country ?? user.country ?? null,
      }),
    );
  }
  await clearVerifyCookies();
  await createSession(toSessionUser({ ...user, emailVerified: true }));
  continueAfterAuth({
    id: user.id,
    role: user.role,
    onboardingDone: Boolean(user.onboardingDone),
    emailVerified: true,
  });
}

async function issueEmailVerification(userId: string) {
  const { session, user } = await loadAuthUser();
  const record = user && user.id === userId ? user : await prisma.user.findUnique({ where: { id: userId } });
  const account =
    record ||
    (session && session.id === userId
      ? {
          id: session.id,
          email: session.email,
          name: session.name,
          role: session.role,
          emailVerified: session.emailVerified,
        }
      : null);
  if (!account) return { error: "Sign in first." };
  if (account.emailVerified) return { error: "This email is already verified." };

  const code = randomOtp();
  const otpHash = await hash(code, 10);
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const token = await new SignJWT({
    purpose: "email-verify",
    id: account.id,
    email: account.email,
    name: account.name,
    role: account.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("24h")
    .sign(authSecret());
  const verifyUrl = `${siteUrl()}/api/auth/verify-email?token=${encodeURIComponent(token)}`;

  if (record) {
    try {
      await prisma.user.update({
        where: { id: account.id },
        data: { emailOtpHash: otpHash, emailOtpExpires: expires },
      });
    } catch {
      /* OTP cookie is the fallback when this SQLite instance does not have the row */
    }
  }

  await writeOtpCookie(account, otpHash);

  const content = verifyEmailContent({ name: account.name.split(" ")[0] || account.name, code, verifyUrl });
  const sent = await sendMail({ to: account.email, ...content });
  if (sent.ok) {
    await writeVerifyStatus({ sent: true });
    await clearCookie(AUTH_COOKIES.verifyHint);
    return { ok: true as const, sent: true };
  }

  const error =
    sent.message ||
    (sent.error === "not_configured"
      ? "Email sending is not configured. Add RESEND_API_KEY in Vercel, verify wova.cc in Resend, and set EMAIL_FROM to Wova <noreply@wova.cc>."
      : "Could not send the verification email. Try again.");

  await writeVerifyStatus({ sent: false, error });

  if (isVercelProduction()) {
    return { error, sent: false as const };
  }

  (await cookies()).set(AUTH_COOKIES.verifyHint, code, authCookieOptions(60 * 60));
  return { ok: true as const, sent: false, demoCode: code, error };
}

export async function sendEmailVerification() {
  const { session, user } = await loadAuthUser();
  if (!user && !session) return { error: "Sign in first." };
  return issueEmailVerification(user?.id || session!.id);
}

export async function peekEmailVerifyHint() {
  const { session, user } = await loadAuthUser();
  const status = await readVerifyStatus();
  const code = (await cookies()).get(AUTH_COOKIES.verifyHint)?.value || null;
  const mailReady = mailConfigured();
  return {
    email: user?.email || session?.email || "",
    mailReady,
    demoCode: isVercelProduction() ? null : code,
    verified: Boolean(user?.emailVerified || session?.emailVerified),
    sent: status.sent,
    sendError:
      (code && !isVercelProduction()
        ? null
        : status.error ||
          (!mailReady
            ? "Email delivery is not set up. Add RESEND_API_KEY in Vercel, verify wova.cc in Resend, and set EMAIL_FROM to Wova <noreply@wova.cc>."
            : usesResendTestSender() && !status.sent
              ? "EMAIL_FROM is still Resend's test sender. Verify wova.cc in Resend and set EMAIL_FROM to Wova <noreply@wova.cc> so codes can reach any inbox."
              : null)),
  };
}

export async function verifyEmailCode(formData: FormData) {
  const { session, user } = await loadAuthUser();
  if (!user && !session) return { error: "Sign in first." };
  if (user?.emailVerified) continueAfterAuth(user);

  const code = String(formData.get("code") || "").replace(/\D/g, "");
  if (code.length !== 6) return { error: "Enter the 6-digit code." };

  const otp = await readOtpCookie();
  const hashToCheck = user?.emailOtpHash || (otp && (otp.id === (user?.id || session?.id) || otp.email === (user?.email || session?.email)) ? otp.hash : null);
  const expires = user?.emailOtpExpires;

  if (!hashToCheck) {
    return { error: "Send a verification email first." };
  }
  if (expires && expires.getTime() < Date.now()) {
    return { error: "That code expired. Send a new email." };
  }
  if (!(await compare(code, hashToCheck))) {
    return { error: "That code is incorrect." };
  }

  const account = user || session;
  if (!account) return { error: "Sign in first." };
  await markEmailVerified({
    id: account.id,
    email: account.email,
    name: account.name,
    role: account.role,
    onboardingDone: user?.onboardingDone,
  });
}

export async function consumeEmailVerifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, authSecret());
    if (payload.purpose !== "email-verify" || !payload.id || !payload.email) {
      return { error: "That link is invalid." };
    }
    const id = String(payload.id);
    const email = String(payload.email).toLowerCase();
    const name = String(payload.name || email);
    const role = String(payload.role || "TALENT");

    let user = await prisma.user.findUnique({ where: { id } });
    if (!user) user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      const session = await getSession();
      if (session && (session.id === id || session.email === email)) {
        user = await restoreUserFromSnapshot({ ...session, emailVerified: true });
      }
    }
    if (user && user.email.toLowerCase() !== email) {
      return { error: "That link is invalid." };
    }
    if (!user) {
      await createSession({
        id,
        email,
        name,
        role: role as "ADMIN" | "CLIENT" | "TALENT",
        emailVerified: true,
      });
      continueAfterAuth({ id, role, onboardingDone: false, emailVerified: true });
    }
    await markEmailVerified({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      onboardingDone: user.onboardingDone,
    });
  } catch (error) {
    unstable_rethrow(error);
    return { error: "That link expired. Send a new verification email." };
  }
}

export async function sendPhoneOtp() {
  const user = await getCurrentUser();
  if (!user) return { error: "Sign in first." };
  if (!user.phone || user.phone.replace(/\D/g, "").length < 10) {
    return { error: "Add a valid phone number to your profile first." };
  }
  if (user.phoneVerified) {
    return { error: "This number is already verified." };
  }

  const code = randomOtp();
  await prisma.user.update({
    where: { id: user.id },
    data: {
      phoneOtpHash: await hash(code, 10),
      phoneOtpExpires: new Date(Date.now() + 10 * 60 * 1000),
    },
  });

  if (isVercelProduction()) {
    return { error: "Phone verification is not configured." };
  }

  return { message: `Demo code: ${code}` };
}

export async function verifyPhoneOtp(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return { error: "Sign in first." };

  const code = String(formData.get("code") || "").replace(/\D/g, "");
  if (code.length !== 6) return { error: "Enter the 6-digit code." };
  if (!user.phoneOtpHash || !user.phoneOtpExpires) {
    return { error: "Send a verification code first." };
  }
  if (user.phoneOtpExpires.getTime() < Date.now()) {
    return { error: "That code expired. Send a new one." };
  }
  if (!(await compare(code, user.phoneOtpHash))) {
    return { error: "That code is incorrect." };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      phoneVerified: true,
      phoneOtpHash: null,
      phoneOtpExpires: null,
    },
  });

  revalidatePath("/profile");
  revalidatePath(`/profile/${user.id}`);
  redirect(user.role === "TALENT" ? `/profile/${user.id}` : "/dashboard");
}
