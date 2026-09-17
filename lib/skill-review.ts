import { formatCall, gradeCode, parseCodeTests, type CodeCaseResult } from "@/lib/grade-code";

export type StoredSkillAnswers = {
  questionIds: string[];
  mcq?: Record<string, number>;
  code?: Record<string, string>;
};

export type SkillQuestionRow = {
  id: string;
  prompt: string;
  options: string;
  correctIndex: number;
  category: string;
  kind: string;
  functionName: string | null;
  tests: string | null;
};

export type ReviewQuestion = {
  id: string;
  kind: "mcq" | "code";
  category: string;
  prompt: string;
  correct: boolean;
  options?: string[];
  selectedIndex?: number | null;
  correctIndex?: number;
  source?: string;
  functionName?: string;
  passed?: number;
  total?: number;
  error?: string;
  results?: CodeCaseResult[];
};

export function parseStoredAnswers(raw: string | null | undefined): StoredSkillAnswers {
  if (!raw) return { questionIds: [] };
  try {
    const parsed = JSON.parse(raw) as StoredSkillAnswers;
    return {
      questionIds: Array.isArray(parsed.questionIds) ? parsed.questionIds.map(String) : [],
      mcq: parsed.mcq && typeof parsed.mcq === "object" ? parsed.mcq : {},
      code: parsed.code && typeof parsed.code === "object" ? parsed.code : {},
    };
  } catch {
    return { questionIds: [] };
  }
}

function parseOptions(value: string) {
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export function reviewSkillAttempt(questions: SkillQuestionRow[], stored: StoredSkillAnswers) {
  const byId = new Map(questions.map((question) => [question.id, question]));
  const rows: ReviewQuestion[] = [];
  let correct = 0;

  for (const questionId of stored.questionIds) {
    const question = byId.get(questionId);
    if (!question) continue;

    if (question.kind === "code") {
      const source = stored.code?.[question.id] ?? "";
      const graded = gradeCode(
        source,
        question.functionName || "solve",
        parseCodeTests(question.tests),
        400,
        true,
      );
      if (graded.ok) correct += 1;
      rows.push({
        id: question.id,
        kind: "code",
        category: question.category,
        prompt: question.prompt,
        correct: graded.ok,
        source,
        functionName: question.functionName || "solve",
        passed: graded.passed,
        total: graded.total,
        error: graded.error,
        results: graded.results,
      });
      continue;
    }

    const options = parseOptions(question.options);
    const selectedIndex = stored.mcq?.[question.id];
    const isCorrect = selectedIndex === question.correctIndex;
    if (isCorrect) correct += 1;
    rows.push({
      id: question.id,
      kind: "mcq",
      category: question.category,
      prompt: question.prompt,
      correct: isCorrect,
      options,
      selectedIndex: typeof selectedIndex === "number" ? selectedIndex : null,
      correctIndex: question.correctIndex,
    });
  }

  return { rows, correct, total: stored.questionIds.length || rows.length };
}

export function formatCodeCall(functionName: string, args: unknown[] | undefined) {
  return formatCall(functionName, args ?? []);
}
