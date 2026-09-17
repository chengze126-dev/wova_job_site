"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import path from "path";
import { mkdir, writeFile } from "fs/promises";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import {
  clientReady,
  HIGH_BADGE_CONNECT_COSTS,
  JOB_CATEGORIES,
  JOB_DURATIONS,
  JOB_TYPES,
  STANDARD_CONNECT_COST,
  talentReady,
} from "@/lib/constants";

export async function createJob(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return { error: "Sign in first." };
  const ready = clientReady(user);
  if (!ready.ok) return { error: ready.reason };

  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const category = String(formData.get("category") || "").trim();
  const skills = String(formData.get("skills") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const budgetMin = Number(formData.get("budgetMin") || 0);
  const budgetMax = Number(formData.get("budgetMax") || 0);
  const budgetType = String(formData.get("budgetType") || "fixed");
  const jobType = String(formData.get("jobType") || "").trim();
  const duration = String(formData.get("duration") || "").trim();
  const highBadge = formData.get("highBadge") === "on";
  const connectCost = Number(formData.get("connectCost") || STANDARD_CONNECT_COST);

  if (title.length < 8) return { error: "Give the job a clearer title." };
  if (description.length < 40) return { error: "Describe the work in at least a short paragraph." };
  if (!JOB_CATEGORIES.includes(category)) return { error: "Pick a category." };
  if (!(JOB_TYPES as readonly string[]).includes(jobType)) return { error: "Pick a job type." };
  if (!(JOB_DURATIONS as readonly string[]).includes(duration)) return { error: "Pick a project length." };
  if (skills.length === 0) return { error: "Add at least one skill." };
  const highCosts: number[] = [...HIGH_BADGE_CONNECT_COSTS];
  if (highBadge && !highCosts.includes(connectCost)) {
    return { error: "High-badge jobs cost 15–20 connects." };
  }
  if (!highBadge && connectCost !== STANDARD_CONNECT_COST) {
    return { error: "Standard jobs cost 10 connects to apply." };
  }

  const job = await prisma.job.create({
    data: {
      title,
      description,
      category,
      skills: JSON.stringify(skills),
      budgetMin: budgetMin || null,
      budgetMax: budgetMax || null,
      budgetType: budgetType === "hourly" ? "hourly" : "fixed",
      jobType,
      duration,
      highBadge,
      connectCost: highBadge ? connectCost : STANDARD_CONNECT_COST,
      clientId: user.id,
    },
  });

  revalidatePath("/jobs");
  redirect(`/jobs/${job.id}`);
}

export async function applyToJob(jobId: string, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return { error: "Sign in first." };
  if (user.role !== "TALENT") {
    return { error: "Only talent accounts can apply. Clients post jobs and review proposals." };
  }
  const ready = talentReady(user);
  if (!ready.ok) return { error: ready.reason };

  const coverLetter = String(formData.get("coverLetter") || "").trim();
  if (coverLetter.length < 40) return { error: "Write a real proposal — at least a short paragraph." };

  const file = formData.get("attachment");
  let attachmentUrl: string | null = null;
  let attachmentName: string | null = null;
  if (file instanceof File && file.size > 0) {
    if (file.size > 8 * 1024 * 1024) return { error: "Attachment must be under 8MB." };
    const ext = path.extname(file.name).toLowerCase() || "";
    const allowed = [".pdf", ".doc", ".docx", ".txt", ".png", ".jpg", ".jpeg", ".zip"];
    if (!allowed.includes(ext)) {
      return { error: "Upload a PDF, DOC, image, or ZIP — or submit without a file." };
    }
    const dir = path.join(process.cwd(), "public", "uploads", "proposals");
    await mkdir(dir, { recursive: true });
    const filename = `${user.id}-${Date.now()}${ext}`;
    await writeFile(path.join(dir, filename), Buffer.from(await file.arrayBuffer()));
    attachmentUrl = `/uploads/proposals/${filename}`;
    attachmentName = file.name.slice(0, 120);
  }

  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job || job.status !== "OPEN") return { error: "This job is not open." };
  if (job.clientId === user.id) return { error: "You cannot apply to your own job." };
  if (job.highBadge && !user.talentBadge) return { error: "High-badge jobs require a Talent badge." };

  const existing = await prisma.application.findUnique({
    where: { jobId_talentId: { jobId, talentId: user.id } },
  });
  if (existing) return { error: "You already applied to this job." };
  if (user.connects < job.connectCost) {
    return { error: `You need ${job.connectCost} connects. Buy a pack first.` };
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { connects: { decrement: job.connectCost } },
    }),
    prisma.application.create({
      data: {
        jobId,
        talentId: user.id,
        coverLetter,
        connectsUsed: job.connectCost,
        attachmentUrl,
        attachmentName,
      },
    }),
  ]);

  revalidatePath(`/jobs/${jobId}`);
  redirect(`/jobs/${jobId}?applied=1`);
}

export async function updateApplicationStatus(applicationId: string, status: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Sign in first." };
  const allowed = ["SHORTLISTED", "HIRED", "REJECTED"];
  if (!allowed.includes(status)) return { error: "Invalid status." };

  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { job: true },
  });
  if (!application) return { error: "Application not found." };
  if (application.job.clientId !== user.id && user.role !== "ADMIN") {
    return { error: "You cannot update this application." };
  }

  await prisma.application.update({ where: { id: applicationId }, data: { status } });
  if (status === "HIRED") {
    await prisma.job.update({ where: { id: application.jobId }, data: { status: "HIRED" } });
  }
  revalidatePath("/dashboard");
  revalidatePath(`/jobs/${application.jobId}`);
  return { ok: true };
}

export async function closeJob(jobId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Sign in first." };
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job || (job.clientId !== user.id && user.role !== "ADMIN")) return { error: "Not allowed." };
  await prisma.job.update({ where: { id: jobId }, data: { status: "CLOSED" } });
  revalidatePath(`/jobs/${jobId}`);
  return { ok: true };
}
