"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { SKILL_CODE_COUNT, SKILL_MCQ_COUNT, SKILL_PASS_SCORE, SKILL_QUESTION_COUNT } from "@/lib/constants";
import { formatCall, gradeCode, parseCodeTests, serializeGradeResult, type GradeResult } from "@/lib/grade-code";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export type { GradeResult };

export type PublicSample = {
  call: string;
  expected: unknown;
};

export type SkillQuestionView = {
  id: string;
  prompt: string;
  options: string[];
  category: string;
  kind: "mcq" | "code";
  starterCode?: string;
  functionName?: string;
  samples?: PublicSample[];
};

function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function pickQuestions<T extends { kind: string }>(questions: T[]) {
  const mcq = shuffle(questions.filter((q) => q.kind !== "code"));
  const code = shuffle(questions.filter((q) => q.kind === "code"));
  const codeTake = Math.min(SKILL_CODE_COUNT, code.length);
  const mcqTake = Math.min(SKILL_MCQ_COUNT, mcq.length, Math.max(0, SKILL_QUESTION_COUNT - codeTake));
  return shuffle([...mcq.slice(0, mcqTake), ...code.slice(0, codeTake)]);
}

function toView(q: {
  id: string;
  prompt: string;
  options: string;
  category: string;
  kind: string;
  starterCode: string | null;
  functionName: string | null;
  tests: string | null;
}): SkillQuestionView {
  if (q.kind === "code") {
    const tests = parseCodeTests(q.tests);
    const functionName = q.functionName || "solve";
    return {
      id: q.id,
      prompt: q.prompt,
      options: [],
      category: q.category,
      kind: "code",
      starterCode: q.starterCode || "",
      functionName,
      samples: tests
        .filter((test) => !test.hidden)
        .map((test) => ({ call: formatCall(functionName, test.args), expected: test.expected })),
    };
  }

  return {
    id: q.id,
    prompt: q.prompt,
    options: JSON.parse(q.options) as string[],
    category: q.category,
    kind: "mcq",
  };
}

export async function getSkillQuestions() {
  const user = await getCurrentUser();
  if (!user || user.role !== "TALENT") return { error: "Only talents can take this test." };

  const questions = await prisma.skillQuestion.findMany();
  const selected = pickQuestions(questions);

  const attempt = await prisma.skillAttempt.create({
    data: {
      talentId: user.id,
      cameraEnabled: true,
      answers: JSON.stringify({ questionIds: selected.map((q) => q.id) }),
    },
  });

  return {
    attemptId: attempt.id,
    questions: selected.map(toView),
  };
}

export async function checkCodingAnswer(attemptId: string, questionId: string, source: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== "TALENT") return { error: "Only talents can check this test." };

  const attempt = await prisma.skillAttempt.findUnique({ where: { id: attemptId } });
  if (!attempt || attempt.talentId !== user.id) return { error: "Attempt not found." };
  if (attempt.completedAt) return { error: "This attempt was already submitted." };

  const questions = await prisma.skillQuestion.findMany({ where: { id: { in: [questionId] } } });
  const question = questions[0];
  if (!question || question.kind !== "code") return { error: "Coding question not found." };

  const result = serializeGradeResult(
    gradeCode(source, question.functionName || "solve", parseCodeTests(question.tests)),
  );
  return { result };
}

export async function submitSkillTest(
  attemptId: string,
  answers: { mcq: Record<string, number>; code: Record<string, string> },
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

  const questions = await prisma.skillQuestion.findMany({ where: { id: { in: questionIds } } });
  if (questions.length === 0) return { error: "No questions found for this attempt." };

  const byId = new Map(questions.map((q) => [q.id, q]));
  let correct = 0;
  for (const questionId of questionIds) {
    const q = byId.get(questionId);
    if (!q) continue;
    if (q.kind === "code") {
      const source = answers.code?.[q.id] ?? "";
      const graded = gradeCode(source, q.functionName || "solve", parseCodeTests(q.tests));
      if (graded.ok) correct += 1;
    } else if (answers.mcq?.[q.id] === q.correctIndex) {
      correct += 1;
    }
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
  redirect(`/skill-test/result?score=${score}&passed=${passed ? "1" : "0"}`);
}
