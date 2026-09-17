import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { CODING_QUESTIONS } from "./coding-questions.ts";
import { deepEqual, gradeCode, parseCodeTests } from "./grade-code.ts";

const SOLUTIONS: Record<string, string> = {
  sumNumbers: `function sumNumbers(nums) {
  return nums.reduce((a, b) => a + b, 0);
}`,
  isPalindrome: `function isPalindrome(s) {
  const t = s.toLowerCase().replace(/ /g, "");
  return t === t.split("").reverse().join("");
}`,
  twoSum: `function twoSum(nums, target) {
  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) {
      if (nums[i] + nums[j] === target) return [i, j];
    }
  }
}`,
  countVowels: `function countVowels(s) {
  return [...s].filter((c) => "aeiouAEIOU".includes(c)).length;
}`,
};

const WRONG: Record<string, string> = {
  sumNumbers: "function sumNumbers(nums) { return nums.length; }",
  isPalindrome: "function isPalindrome(s) { return s === s.split('').reverse().join(''); }",
  twoSum: "function twoSum(nums, target) { return [0, 1]; }",
  countVowels: "function countVowels(s) { return s.length; }",
};

function question(name: string) {
  const found = CODING_QUESTIONS.find((item) => item.functionName === name);
  assert.ok(found, `missing question ${name}`);
  return found;
}

describe("coding answer matching", () => {
  test("deepEqual matches nested answers", () => {
    assert.equal(deepEqual([0, 1], [0, 1]), true);
    assert.equal(deepEqual([1, 0], [0, 1]), false);
    assert.equal(deepEqual({ a: 1 }, { a: 1 }), true);
    assert.equal(deepEqual(6, 6), true);
    assert.equal(deepEqual(true, false), false);
  });

  test("parseCodeTests keeps expected answers, including 0 and false", () => {
    const tests = parseCodeTests(
      JSON.stringify([
        { args: [[]], expected: 0 },
        { args: ["hello"], expected: false },
        { args: [1], expected: 1, hidden: true },
        { args: [1] },
      ]),
    );
    assert.equal(tests.length, 3);
    assert.equal(tests[0].expected, 0);
    assert.equal(tests[1].expected, false);
    assert.equal(tests[2].hidden, true);
  });

  for (const item of CODING_QUESTIONS) {
    test(`${item.functionName} matches every expected answer`, () => {
      const source = SOLUTIONS[item.functionName];
      assert.ok(source, `missing solution for ${item.functionName}`);
      const result = gradeCode(source, item.functionName, item.tests);
      assert.equal(result.error, undefined);
      assert.equal(result.total, item.tests.length);
      assert.equal(result.passed, item.tests.length);
      assert.equal(result.ok, true);
      for (const [index, row] of result.results.entries()) {
        assert.equal(row.passed, true, `${item.functionName} case ${index} should match`);
        if (!row.hidden) {
          assert.equal(deepEqual(row.actual, item.tests[index].expected), true);
          assert.equal(deepEqual(row.expected, item.tests[index].expected), true);
        }
      }
    });

    test(`${item.functionName} rejects a wrong answer`, () => {
      const source = WRONG[item.functionName];
      assert.ok(source, `missing wrong solution for ${item.functionName}`);
      const result = gradeCode(source, item.functionName, item.tests);
      assert.equal(result.ok, false);
      assert.ok(result.passed < result.total);
    });
  }

  test("Check tests reports expected vs actual on a mismatch", () => {
    const q = question("sumNumbers");
    const result = gradeCode("function sumNumbers(nums) { return nums.length; }", q.functionName, q.tests);
    const visible = result.results.find((row) => !row.hidden);
    assert.ok(visible);
    assert.equal(visible.passed, false);
    assert.equal(visible.expected, 6);
    assert.equal(visible.actual, 3);
  });

  test("empty code does not match", () => {
    const q = question("sumNumbers");
    const result = gradeCode("   ", q.functionName, q.tests);
    assert.equal(result.ok, false);
    assert.equal(result.error, "Write a solution before checking.");
  });
});
