"use server";

import { hash, compare } from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSession, destroySession, getCurrentUser } from "@/lib/auth";
import { COMPANY_SIZES, COUNTRIES, INDUSTRIES, parseSkills } from "@/lib/constants";
import { savePublicUpload } from "@/lib/uploads";
import { revalidatePath } from "next/cache";
import { isStrongPassword } from "@/lib/password";
import { emptyExtras, stringifyExtras } from "@/lib/profile-extras";

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
  if (existing) return { error: "An account with that email already exists. Log in instead." };

  const name = `${parsed.data.firstName} ${parsed.data.lastName}`.trim();
  const user = await prisma.user.create({
    data: {
      name,
      email: parsed.data.email.toLowerCase(),
      passwordHash: await hash(parsed.data.password, 10),
      role: parsed.data.role,
      country: parsed.data.country,
      connects: 0,
    },
  });

  await createSession({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as "CLIENT" | "TALENT",
  });

  redirect("/onboarding");
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
    await createSession(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role as "ADMIN" | "CLIENT" | "TALENT",
      },
      { remember },
    );
  } catch (error) {
    if (error instanceof Error && error.message.includes("AUTH_SECRET")) {
      return { error: "Server auth is not configured. Add AUTH_SECRET in Vercel environment variables." };
    }
    throw error;
  }

  if (!user.onboardingDone && user.role !== "ADMIN") redirect("/onboarding");
  if (user.role === "ADMIN") redirect("/admin");
  if (user.role === "TALENT") redirect("/dashboard");
  redirect("/");
}

export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();
  if (!email.includes("@")) return { error: "Enter the email address for your account." };

  await prisma.user.findUnique({ where: { email } });
  return {
    ok: true,
    message: "If an account exists for that email, we sent a reset link. Check your inbox.",
  };
}

export async function logoutUser() {
  await destroySession();
  redirect("/");
}

export async function completeTalentOnboarding(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || user.role !== "TALENT") return { error: "Only talent accounts can complete this step." };

  const linkedinUrl = String(formData.get("linkedinUrl") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const bio = String(formData.get("bio") || "").trim();
  const title = String(formData.get("title") || "").trim();
  const hourlyRate = Number(String(formData.get("hourlyRate") || "").trim());
  const skills = parseSkills(String(formData.get("skills") || ""));
  const city = String(formData.get("city") || "").trim();
  const resume = formData.get("resume");
  const avatar = formData.get("avatar");

  if (!linkedinUrl.includes("linkedin.com")) {
    return { error: "Enter a full LinkedIn profile URL." };
  }
  if (phone.replace(/\D/g, "").length < 10) {
    return { error: "Enter a valid phone number." };
  }
  if (title.length < 4) return { error: "Add a professional title, like Full-Stack Developer." };
  if (!Number.isFinite(hourlyRate) || hourlyRate < 5 || hourlyRate > 500) {
    return { error: "Enter an hourly rate between $5 and $500." };
  }
  if (skills.length < 2) return { error: "Add at least two skills." };

  if (!(avatar instanceof File) || avatar.size === 0) {
    return { error: "Upload a profile photo to continue." };
  }
  const avatarSaved = await savePublicUpload({
    file: avatar,
    folder: "avatars",
    userId: user.id,
    allowed: [".jpg", ".jpeg", ".png", ".webp"],
    maxBytes: 5 * 1024 * 1024,
  });
  if ("error" in avatarSaved) return { error: avatarSaved.error };

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

  const extras = emptyExtras();
  extras.city = city || undefined;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      linkedinUrl,
      phone,
      bio,
      resumeUrl,
      avatarUrl: avatarSaved.url,
      title,
      hourlyRate,
      skills: JSON.stringify(skills),
      extras: stringifyExtras(extras),
      onboardingDone: true,
    },
  });

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
  const phone = String(formData.get("phone") || "").trim();
  const bio = String(formData.get("bio") || "").trim();

  if (companyName.length < 2) return { error: "Company name is required." };
  if (!COMPANY_SIZES.some((s) => s.value === companySize)) return { error: "Select a company size." };
  if (!INDUSTRIES.includes(companyIndustry)) return { error: "Select an industry." };
  if (phone.replace(/\D/g, "").length < 10) return { error: "Enter a valid phone number." };

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
    },
  });

  redirect("/dashboard");
}

export async function updateProfile(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return { error: "Sign in first." };
  const bio = String(formData.get("bio") || "").trim();
  const name = String(formData.get("name") || "").trim();
  if (name.length < 2) return { error: "Name is required." };

  const data: Record<string, unknown> = { bio, name };
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
  revalidatePath("/profile");
  revalidatePath("/profile/settings");
  revalidatePath(`/profile/${user.id}`);
  revalidatePath("/talents");
  redirect("/profile/settings");
}

function randomOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
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
  redirect("/dashboard");
}
