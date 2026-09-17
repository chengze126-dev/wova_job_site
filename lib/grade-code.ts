import { createContext, Script } from "node:vm";
import type { CodeTest } from "@/lib/coding-questions";

const BLOCKED =
  /\b(?:process|require|module|exports|globalThis|global|Function|eval|WebAssembly|fetch|XMLHttpRequest|importScripts|Worker|SharedArrayBuffer|Atomics|__proto__)\b/;

export type CodeCaseResult = {
  hidden: boolean;
  passed: boolean;
  args?: unknown[];
  expected?: unknown;
  actual?: unknown;
  error?: string;
};

export type GradeResult = {
  ok: boolean;
  passed: number;
  total: number;
  error?: string;
  results: CodeCaseResult[];
};

export function deepEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== typeof b) return false;
  if (a == null || b == null) return a === b;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((value, index) => deepEqual(value, b[index]));
  }
  if (typeof a === "object" && typeof b === "object") {
    const left = Object.keys(a as object).sort();
    const right = Object.keys(b as object).sort();
    if (left.length !== right.length) return false;
    return left.every(
      (key, index) =>
        key === right[index] &&
        deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key]),
    );
  }
  return false;
}

function toPlain(value: unknown): unknown {
  if (value === undefined) return null;
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "function" || typeof value === "symbol") return String(value);
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return String(value);
  }
}

export function serializeGradeResult(result: GradeResult): GradeResult {
  return JSON.parse(JSON.stringify(result, (_key, value) => (value === undefined ? null : value))) as GradeResult;
}

export function parseCodeTests(value: string | null | undefined): CodeTest[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is CodeTest => {
      if (!item || typeof item !== "object") return false;
      const row = item as CodeTest;
      return Array.isArray(row.args) && "expected" in row;
    });
  } catch {
    return [];
  }
}

export function gradeCode(
  source: string,
  functionName: string,
  tests: CodeTest[],
  timeoutMs = 400,
  revealHidden = false,
): GradeResult {
  const total = tests.length;
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(functionName)) {
    return { ok: false, passed: 0, total, error: "Invalid function name.", results: [] };
  }
  if (!source.trim()) {
    return { ok: false, passed: 0, total, error: "Write a solution before checking.", results: [] };
  }
  if (source.length > 20_000) {
    return { ok: false, passed: 0, total, error: "Solution is too long.", results: [] };
  }
  if (BLOCKED.test(source)) {
    return { ok: false, passed: 0, total, error: "Solution uses a disallowed API.", results: [] };
  }

  const wrapped = `
    "use strict";
    ${source}
    if (typeof ${functionName} !== "function") {
      throw new Error("Define function ${functionName}");
    }
    __result = ${functionName}(...__args);
  `;

  let script: Script;
  try {
    script = new Script(wrapped, { filename: "solution.js" });
  } catch (error) {
    return {
      ok: false,
      passed: 0,
      total,
      error: error instanceof Error ? error.message : "Syntax error.",
      results: [],
    };
  }

  const results: CodeCaseResult[] = [];
  let passed = 0;

  for (const test of tests) {
    const hidden = Boolean(test.hidden);
    const context = createContext({
      __args: toPlain(test.args),
      __result: undefined as unknown,
      Math,
      JSON,
      Array,
      Object,
      String,
      Number,
      Boolean,
      Date,
      Map,
      Set,
      parseInt,
      parseFloat,
      isNaN,
      isFinite,
      Infinity,
      NaN,
      undefined,
    });

    try {
      script.runInContext(context, { timeout: timeoutMs, displayErrors: false });
      const actual = toPlain(context.__result);
      const expected = toPlain(test.expected);
      const ok = deepEqual(actual, expected);
      if (ok) passed += 1;
      results.push(
        hidden && !revealHidden
          ? { hidden: true, passed: ok }
          : {
              hidden,
              passed: ok,
              args: toPlain(test.args) as unknown[],
              expected,
              actual,
            },
      );
    } catch (error) {
      results.push(
        hidden && !revealHidden
          ? { hidden: true, passed: false, error: "Hidden test failed." }
          : {
              hidden,
              passed: false,
              args: toPlain(test.args) as unknown[],
              expected: toPlain(test.expected),
              error: error instanceof Error ? error.message : "Runtime error.",
            },
      );
    }
  }

  return serializeGradeResult({ ok: passed === total && total > 0, passed, total, results });
}

export function formatCall(functionName: string, args: unknown[]) {
  return `${functionName}(${args.map((arg) => JSON.stringify(arg)).join(", ")})`;
}
