export type CodeTest = {
  args: unknown[];
  expected: unknown;
  hidden?: boolean;
};

export type CodingQuestionSeed = {
  category: string;
  prompt: string;
  functionName: string;
  starterCode: string;
  tests: CodeTest[];
};

export const CODING_QUESTIONS: CodingQuestionSeed[] = [
  {
    category: "JavaScript",
    functionName: "sumNumbers",
    prompt:
      "Write `sumNumbers(nums)` that returns the sum of every number in the array. Return 0 for an empty array.\n\nExample: sumNumbers([1, 2, 3]) → 6",
    starterCode: `function sumNumbers(nums) {
  // return the sum of nums
}
`,
    tests: [
      { args: [[1, 2, 3]], expected: 6 },
      { args: [[]], expected: 0 },
      { args: [[-2, 5]], expected: 3, hidden: true },
      { args: [[10]], expected: 10, hidden: true },
      { args: [[1.5, 2.5]], expected: 4, hidden: true },
    ],
  },
  {
    category: "JavaScript",
    functionName: "isPalindrome",
    prompt:
      "Write `isPalindrome(s)` that returns true if `s` is a palindrome. Ignore spaces and letter case.\n\nExample: isPalindrome(\"Race car\") → true",
    starterCode: `function isPalindrome(s) {
  // return true if s is a palindrome
}
`,
    tests: [
      { args: ["racecar"], expected: true },
      { args: ["Race car"], expected: true },
      { args: ["hello"], expected: false },
      { args: [""], expected: true, hidden: true },
      { args: ["Abba"], expected: true, hidden: true },
      { args: ["race a car"], expected: false, hidden: true },
    ],
  },
  {
    category: "JavaScript",
    functionName: "twoSum",
    prompt:
      "Write `twoSum(nums, target)` that returns the indices of two different numbers that add up to `target`. Return those two indices in ascending order. There is always exactly one pair.\n\nExample: twoSum([2, 7, 11, 15], 9) → [0, 1]",
    starterCode: `function twoSum(nums, target) {
  // return [i, j] in ascending order
}
`,
    tests: [
      { args: [[2, 7, 11, 15], 9], expected: [0, 1] },
      { args: [[3, 2, 4], 6], expected: [1, 2] },
      { args: [[3, 3], 6], expected: [0, 1], hidden: true },
      { args: [[1, 5, 3, 8], 11], expected: [2, 3], hidden: true },
    ],
  },
  {
    category: "JavaScript",
    functionName: "countVowels",
    prompt:
      "Write `countVowels(s)` that returns how many vowels (a, e, i, o, u) are in the string. Count both lowercase and uppercase.\n\nExample: countVowels(\"hello\") → 2",
    starterCode: `function countVowels(s) {
  // return the vowel count
}
`,
    tests: [
      { args: ["hello"], expected: 2 },
      { args: ["xyz"], expected: 0 },
      { args: ["AEIOU"], expected: 5, hidden: true },
      { args: [""], expected: 0, hidden: true },
      { args: ["Queue"], expected: 4, hidden: true },
    ],
  },
];

export function toCodeQuestionRow(question: CodingQuestionSeed) {
  return {
    category: question.category,
    prompt: question.prompt,
    options: JSON.stringify([]),
    correctIndex: -1,
    kind: "code" as const,
    starterCode: question.starterCode,
    functionName: question.functionName,
    tests: JSON.stringify(question.tests),
  };
}
