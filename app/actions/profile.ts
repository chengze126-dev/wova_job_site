"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect, RedirectType } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseSkills } from "@/lib/constants";
import { parseExtras, stringifyExtras, type ProfileExtras } from "@/lib/profile-extras";
import { savePublicUpload } from "@/lib/uploads";

async function saveExtras(userId: string, extras: ProfileExtras) {
  await prisma.user.update({ where: { id: userId }, data: { extras: stringifyExtras(extras) } });
  revalidatePath("/profile");
  revalidatePath("/profile/settings");
  revalidatePath(`/profile/${userId}`);
  revalidatePath("/talents");
}

export async function updateProfileBasics(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || user.role !== "TALENT") return { error: "Sign in as talent first." };

  const name = String(formData.get("name") || "").trim();
  const title = String(formData.get("title") || "").trim();
  const bio = String(formData.get("bio") || "").trim();
  const city = String(formData.get("city") || "").trim();
  const hourlyRate = Number(String(formData.get("hourlyRate") || "").trim());
  const skills = parseSkills(String(formData.get("skills") || ""));
  const hoursPerWeek = String(formData.get("hoursPerWeek") || "").trim();
  const githubUrl = String(formData.get("githubUrl") || "").trim();
  const availableNow = formData.get("availableNow") === "on";

  if (name.length < 2) return { error: "Name is required." };
  if (title.length < 4) return { error: "Add a professional title." };
  if (!Number.isFinite(hourlyRate) || hourlyRate < 5 || hourlyRate > 500) {
    return { error: "Enter an hourly rate between $5 and $500." };
  }
  if (skills.length < 2) return { error: "Add at least two skills." };

  const extras = parseExtras(user.extras);
  extras.city = city || extras.city;
  extras.hoursPerWeek = hoursPerWeek || extras.hoursPerWeek;
  extras.githubUrl = githubUrl || extras.githubUrl;
  extras.availableNow = availableNow;

  const data: Record<string, unknown> = {
    name,
    title,
    bio,
    hourlyRate,
    skills: JSON.stringify(skills),
    extras: stringifyExtras(extras),
  };

  const avatar = formData.get("avatar");
  if (avatar instanceof File && avatar.size > 0) {
    const saved = await savePublicUpload({
      file: avatar,
      folder: "avatars",
      userId: user.id,
      allowed: [".jpg", ".jpeg", ".png", ".webp"],
      maxBytes: 5 * 1024 * 1024,
    });
    if ("error" in saved) return { error: saved.error };
    data.avatarUrl = saved.url;
  } else if (!user.avatarUrl) {
    return { error: "Upload a profile photo." };
  }

  await prisma.user.update({ where: { id: user.id }, data });
  revalidatePath("/profile");
  revalidatePath("/profile/settings");
  revalidatePath(`/profile/${user.id}`);
  revalidatePath("/talents");
  redirect("/profile/settings", RedirectType.replace);
}

export async function toggleAvailableNow() {
  const user = await getCurrentUser();
  if (!user || user.role !== "TALENT") return { error: "Sign in as talent first." };
  const extras = parseExtras(user.extras);
  extras.availableNow = !extras.availableNow;
  await saveExtras(user.id, extras);
}

export async function addLanguage(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || user.role !== "TALENT") return { error: "Sign in as talent first." };
  const name = String(formData.get("name") || "").trim();
  const level = String(formData.get("level") || "").trim();
  if (!name || !level) return { error: "Language and level are required." };
  const extras = parseExtras(user.extras);
  extras.languages = [...extras.languages, { name, level }];
  await saveExtras(user.id, extras);
}

export async function addEducation(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || user.role !== "TALENT") return { error: "Sign in as talent first." };
  const school = String(formData.get("school") || "").trim();
  const degree = String(formData.get("degree") || "").trim();
  const years = String(formData.get("years") || "").trim();
  if (!school || !degree) return { error: "School and degree are required." };
  const extras = parseExtras(user.extras);
  extras.education = [...extras.education, { id: randomUUID(), school, degree, years }];
  await saveExtras(user.id, extras);
}

export async function removeEducation(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || user.role !== "TALENT") return { error: "Sign in as talent first." };
  const id = String(formData.get("id") || "");
  const extras = parseExtras(user.extras);
  extras.education = extras.education.filter((item) => item.id !== id);
  await saveExtras(user.id, extras);
}

export async function addEmployment(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || user.role !== "TALENT") return { error: "Sign in as talent first." };
  const title = String(formData.get("title") || "").trim();
  const company = String(formData.get("company") || "").trim();
  const dates = String(formData.get("dates") || "").trim();
  const summary = String(formData.get("summary") || "").trim();
  if (!title || !company) return { error: "Title and company are required." };
  const extras = parseExtras(user.extras);
  extras.employment = [...extras.employment, { id: randomUUID(), title, company, dates, summary }];
  await saveExtras(user.id, extras);
}

export async function removeEmployment(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || user.role !== "TALENT") return { error: "Sign in as talent first." };
  const id = String(formData.get("id") || "");
  const extras = parseExtras(user.extras);
  extras.employment = extras.employment.filter((item) => item.id !== id);
  await saveExtras(user.id, extras);
}

export async function addPortfolio(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || user.role !== "TALENT") return { error: "Sign in as talent first." };
  const title = String(formData.get("title") || "").trim();
  const url = String(formData.get("url") || "").trim();
  const file = formData.get("image");
  if (!title) return { error: "Title is required." };
  if (!(file instanceof File) || file.size === 0) return { error: "Upload a portfolio image." };
  const saved = await savePublicUpload({
    file,
    folder: "portfolio",
    userId: user.id,
    allowed: [".jpg", ".jpeg", ".png", ".webp"],
    maxBytes: 5 * 1024 * 1024,
  });
  if ("error" in saved) return { error: saved.error };
  const extras = parseExtras(user.extras);
  extras.portfolio = [...extras.portfolio, { id: randomUUID(), title, image: saved.url, url: url || undefined }];
  await saveExtras(user.id, extras);
}

export async function removePortfolio(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || user.role !== "TALENT") return { error: "Sign in as talent first." };
  const id = String(formData.get("id") || "");
  const extras = parseExtras(user.extras);
  extras.portfolio = extras.portfolio.filter((item) => item.id !== id);
  await saveExtras(user.id, extras);
}

export async function addCertification(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || user.role !== "TALENT") return { error: "Sign in as talent first." };
  const name = String(formData.get("name") || "").trim();
  const issuer = String(formData.get("issuer") || "").trim();
  if (!name) return { error: "Certification name is required." };
  const extras = parseExtras(user.extras);
  extras.certifications = [...extras.certifications, { id: randomUUID(), name, issuer, verified: false }];
  await saveExtras(user.id, extras);
}

export async function removeCertification(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || user.role !== "TALENT") return { error: "Sign in as talent first." };
  const id = String(formData.get("id") || "");
  const extras = parseExtras(user.extras);
  extras.certifications = extras.certifications.filter((item) => item.id !== id);
  await saveExtras(user.id, extras);
}

export async function addOtherExperience(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || user.role !== "TALENT") return { error: "Sign in as talent first." };
  const title = String(formData.get("title") || "").trim();
  const url = String(formData.get("url") || "").trim();
  const summary = String(formData.get("summary") || "").trim();
  if (!title) return { error: "Title is required." };
  const extras = parseExtras(user.extras);
  extras.otherExperience = [...extras.otherExperience, { id: randomUUID(), title, url: url || undefined, summary }];
  await saveExtras(user.id, extras);
}

export async function removeOtherExperience(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || user.role !== "TALENT") return { error: "Sign in as talent first." };
  const id = String(formData.get("id") || "");
  const extras = parseExtras(user.extras);
  extras.otherExperience = extras.otherExperience.filter((item) => item.id !== id);
  await saveExtras(user.id, extras);
}
