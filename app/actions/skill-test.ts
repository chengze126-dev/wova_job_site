"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { SKILL_PASS_SCORE } from "@/lib/constants";
import { getStackQuestionById, pickTestQuestions, type SkillMcq } from "@/lib/skill-bank";
import { getSkillStack, QUESTIONS_PER_TEST } from "@/lib/skill-stacks";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export type SkillQuestionView = {
  id: string;
  prompt: string;
  options: string[];
  category: string;
  kind: "mcq";
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

export async function getSkillQuestions(stackSlug: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== "TALENT") return { error: "Only talents can take this test." };
  const stack = getSkillStack(stackSlug);
  if (!stack) return { error: "Pick a stack to start." };

  const selected = pickTestQuestions(stack.slug, QUESTIONS_PER_TEST);
  if (selected.length < QUESTIONS_PER_TEST) return { error: "Could not load questions for that stack." };

  const attempt = await prisma.skillAttempt.create({
    data: {
      talentId: user.id,
      cameraEnabled: true,
      answers: JSON.stringify({ stack: stack.slug, questionIds: selected.map((q) => q.id) }),
    },
  });

  return {
    attemptId: attempt.id,
    stack: stack.name,
    questions: selected.map(toView),
  };
}

export async function submitSkillTest(
  attemptId: string,
  answers: { mcq: Record<string, number> },
  cameraEnabled: boolean,
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "TALENT") return { error: "Only talents can submit this test." };

  const attempt = await prisma.skillAttempt.findUnique({ where: { id: attemptId } });
  if (!attempt || attempt.talentId !== user.id) return { error: "Attempt not found." };
  if (attempt.completedAt) return { error: "This attempt was already submitted." };
  if (!cameraEnabled) return { error: "Camera must stay on for the full test." };

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
      cameraEnabled,
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
