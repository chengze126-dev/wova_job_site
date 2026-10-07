"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { INTRO_MAX_SECONDS, INTRO_MIN_SECONDS, SKILL_PASS_SCORE } from "@/lib/constants";
import { getStackQuestionById, pickTestQuestions, type SkillMcq } from "@/lib/skill-bank";
import { getSkillStack, QUESTIONS_PER_TEST } from "@/lib/skill-stacks";
import { isAdminEmail } from "@/lib/admin";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

const HEARTBEAT_MAX_MS = 20_000;
const FRAME_MAX_CHARS = 180_000;

export type SkillQuestionView = {
  id: string;
  prompt: string;
  options: string[];
  category: string;
  kind: "mcq";
};

export type LiveSkillMonitor = {
  id: string;
  talentName: string;
  talentEmail: string;
  stackName: string;
  questionIndex: number;
  questionCount: number;
  cameraOn: boolean;
  cameraLive: boolean;
  cameraState: "live" | "off" | "lost" | "starting";
  lastHeartbeat: string | null;
  startedAt: string;
  frame: string | null;
};

function toView(question: SkillMcq): SkillQuestionView {
  return {
    id: question.id,
    prompt: question.prompt,
    options: question.options,
    category: question.category,
    kind: "mcq",
  };
}

function heartbeatFresh(lastHeartbeat: Date | null, maxMs = HEARTBEAT_MAX_MS) {
  if (!lastHeartbeat) return false;
  return Date.now() - lastHeartbeat.getTime() <= maxMs;
}

function cameraConfirmed(attempt: { cameraOn: boolean; lastHeartbeat: Date | null }) {
  return Boolean(attempt.cameraOn && heartbeatFresh(attempt.lastHeartbeat));
}

function parseQuestionCount(answers: string | null) {
  try {
    const stored = answers ? (JSON.parse(answers) as { questionIds?: string[] }) : {};
    return Array.isArray(stored.questionIds) ? stored.questionIds.length : QUESTIONS_PER_TEST;
  } catch {
    return QUESTIONS_PER_TEST;
  }
}

export async function saveSkillIntroVideo(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || user.role !== "TALENT") return { error: "Only developers can record an introduction." };

  const file = formData.get("video");
  const seconds = Number(formData.get("seconds"));
  if (!(file instanceof File) || file.size < 40_000) {
    return { error: "Record a real introduction video first." };
  }
  if (file.size > 35 * 1024 * 1024) {
    return { error: "Keep the video under 35MB. Speak in English for 2–5 minutes." };
  }
  if (!Number.isFinite(seconds) || seconds < INTRO_MIN_SECONDS) {
    return { error: "The introduction must be at least 2 minutes, in English." };
  }
  if (seconds > INTRO_MAX_SECONDS + 8) {
    return { error: "The introduction must be 5 minutes or less." };
  }
  const mime = (file.type || "video/webm").toLowerCase();
  if (!mime.startsWith("video/")) return { error: "Upload a video file." };

  const buffer = Buffer.from(await file.arrayBuffer());
  await prisma.introVideo.save({ userId: user.id, buffer });
  const url = `/api/intro-video/${user.id}`;
  await prisma.user.update({
    where: { id: user.id },
    data: {
      introVideoUrl: url,
      introVideoMime: mime,
      introVideoSeconds: Math.round(seconds),
      introVideoAt: new Date(),
    },
  });
  revalidatePath("/skill-test");
  revalidatePath("/admin");
  revalidatePath(`/profile/${user.id}`);
  return { ok: true as const, url, seconds: Math.round(seconds) };
}

export async function getSkillQuestions(stackSlug: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== "TALENT") return { error: "Only talents can take this test." };
  const stack = getSkillStack(stackSlug);
  if (!stack) return { error: "Pick a stack to start." };
  if (!user.introVideoUrl) {
    return { error: "Record a 2–5 minute English introduction video before the skill test." };
  }

  const selected = pickTestQuestions(stack.slug, QUESTIONS_PER_TEST);
  if (selected.length < QUESTIONS_PER_TEST) return { error: "Could not load questions for that stack." };

  const attempt = await prisma.skillAttempt.create({
    data: {
      talentId: user.id,
      cameraEnabled: false,
      cameraOn: false,
      questionIndex: 0,
      stackName: stack.name,
      answers: JSON.stringify({ stack: stack.slug, questionIds: selected.map((q) => q.id) }),
    },
  });

  return {
    attemptId: attempt!.id,
    stack: stack.name,
    questions: selected.map(toView),
  };
}

export async function pingSkillTest(
  attemptId: string,
  payload: { cameraOn: boolean; questionIndex: number; frame?: string | null },
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "TALENT") return { error: "Only talents can ping this test." };

  const attempt = await prisma.skillAttempt.findUnique({ where: { id: attemptId } });
  if (!attempt || attempt.talentId !== user.id) return { error: "Attempt not found." };
  if (attempt.completedAt) return { ok: true as const, cameraConfirmed: false };

  const frame =
    typeof payload.frame === "string" &&
    payload.frame.startsWith("data:image/") &&
    payload.frame.length <= FRAME_MAX_CHARS
      ? payload.frame
      : undefined;

  await prisma.skillAttempt.update({
    where: { id: attemptId },
    data: {
      cameraOn: Boolean(payload.cameraOn),
      cameraEnabled: Boolean(payload.cameraOn),
      lastHeartbeat: new Date(),
      questionIndex: Math.max(0, Number(payload.questionIndex) || 0),
      ...(frame ? { cameraFrame: frame } : {}),
    },
  });

  return { ok: true as const, cameraConfirmed: Boolean(payload.cameraOn) };
}

export async function getLiveSkillMonitors(options?: {
  frames?: boolean;
}): Promise<LiveSkillMonitor[] | { error: string }> {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN" || !isAdminEmail(user.email)) {
    return { error: "Admin only." };
  }

  const includeFrames = options?.frames !== false;
  const attempts = await prisma.skillAttempt.findMany({
    where: { completedAt: null },
    include: { talent: true },
    orderBy: { startedAt: "desc" },
  });

  return attempts.map((attempt) => {
    const live = cameraConfirmed(attempt);
    const cameraState: LiveSkillMonitor["cameraState"] = !attempt.lastHeartbeat
      ? "starting"
      : live
        ? "live"
        : attempt.cameraOn
          ? "lost"
          : "off";
    return {
      id: attempt.id,
      talentName: attempt.talent?.name || "Unknown talent",
      talentEmail: attempt.talent?.email || "",
      stackName: attempt.stackName || "Skill test",
      questionIndex: attempt.questionIndex,
      questionCount: parseQuestionCount(attempt.answers),
      cameraOn: attempt.cameraOn,
      cameraLive: live,
      cameraState,
      lastHeartbeat: attempt.lastHeartbeat ? attempt.lastHeartbeat.toISOString() : null,
      startedAt: attempt.startedAt.toISOString(),
      frame: includeFrames && live ? attempt.cameraFrame : null,
    };
  });
}

export async function submitSkillTest(attemptId: string, answers: { mcq: Record<string, number> }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "TALENT") return { error: "Only talents can submit this test." };

  const attempt = await prisma.skillAttempt.findUnique({ where: { id: attemptId } });
  if (!attempt || attempt.talentId !== user.id) return { error: "Attempt not found." };
  if (attempt.completedAt) return { error: "This attempt was already submitted." };
  if (!cameraConfirmed(attempt)) {
    return { error: "Camera must stay on for the full test. Admin could not confirm a live camera." };
  }

  let questionIds: string[] = [];
  try {
    const stored = attempt.answers ? (JSON.parse(attempt.answers) as { questionIds?: string[] }) : {};
    questionIds = Array.isArray(stored.questionIds) ? stored.questionIds : [];
  } catch {
    questionIds = [];
  }
  if (questionIds.length === 0) return { error: "This attempt has no questions." };

  let correct = 0;
  for (const questionId of questionIds) {
    const question = getStackQuestionById(questionId);
    if (!question) continue;
    if (answers.mcq?.[question.id] === question.correctIndex) correct += 1;
  }
  const score = Math.round((correct / questionIds.length) * 100);
  const passed = score >= SKILL_PASS_SCORE;

  await prisma.skillAttempt.update({
    where: { id: attemptId },
    data: {
      completedAt: new Date(),
      score,
      passed,
      cameraEnabled: true,
      cameraOn: true,
      answers: JSON.stringify({ ...answers, questionIds }),
    },
  });

  if (passed) {
    await prisma.user.update({
      where: { id: user.id },
      data: { skillTestPassed: true, talentBadge: true },
    });
  }

  revalidatePath("/profile");
  revalidatePath(`/profile/${user.id}`);
  revalidatePath("/admin");
  revalidatePath("/dashboard");
  redirect(`/skill-test/result?score=${score}&passed=${passed ? "1" : "0"}`);
}
