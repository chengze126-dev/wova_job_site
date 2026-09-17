export const CONNECT_PACK = {
  connects: 100,
  priceCents: 1000,
  label: "$10 for 100 connects",
};

export const STANDARD_CONNECT_COST = 10;
export const HIGH_BADGE_CONNECT_COSTS = [15, 16, 17, 18, 19, 20] as const;
export const SKILL_PASS_SCORE = 70;
export const SKILL_QUESTION_COUNT = 10;
export const SKILL_MCQ_COUNT = 10;
export const SKILL_CODE_COUNT = 0;
export const SKILL_TIME_MINUTES = 20;
export const PROBLEMS_PER_STACK = 1000;

export const COMPANY_SIZES = [
  { value: "1", label: "Just me" },
  { value: "2-10", label: "2–10 people" },
  { value: "11-50", label: "11–50 people" },
  { value: "51-200", label: "51–200 people" },
  { value: "201-1000", label: "201–1,000 people" },
  { value: "1000+", label: "1,000+ people" },
];

export const INDUSTRIES = [
  "Software & IT",
  "Design & Creative",
  "Marketing",
  "Finance",
  "Healthcare",
  "Education",
  "E-commerce",
  "Operations",
  "Other",
];

export const COUNTRIES = [
  "United States",
  "United Kingdom",
  "Canada",
  "Australia",
  "Germany",
  "France",
  "Netherlands",
  "Spain",
  "Italy",
  "Ireland",
  "Sweden",
  "Norway",
  "Denmark",
  "Finland",
  "Poland",
  "Portugal",
  "India",
  "Pakistan",
  "Bangladesh",
  "Philippines",
  "Indonesia",
  "Singapore",
  "United Arab Emirates",
  "Saudi Arabia",
  "Nigeria",
  "Kenya",
  "South Africa",
  "Brazil",
  "Mexico",
  "Argentina",
  "Japan",
  "South Korea",
  "New Zealand",
  "Ukraine",
  "Romania",
  "Other",
];

export const JOB_TYPES = ["Full-time", "Part-time", "Contract", "Temporary"] as const;
export const JOB_DURATIONS = [
  "Less than 1 month",
  "1–3 months",
  "3–6 months",
  "More than 6 months",
] as const;

export function jobTypeFromTitle(title: string) {
  const t = title.toLowerCase();
  if (t.includes("part-time")) return "Part-time";
  if (t.includes("photographer") || t.includes("shoot 40")) return "Temporary";
  if (t.includes("android engineer") || t.includes("driver android") || t.includes("full ehr")) return "Full-time";
  return "Contract";
}

export function jobDurationFromTitle(title: string) {
  const t = title.toLowerCase();
  if (t.includes("ongoing") || t.includes("bookkeeper")) return "More than 6 months";
  if (
    t.includes("2–3 weeks") ||
    t.includes("2-3 weeks") ||
    t.includes("week after next") ||
    t.includes("40 skus") ||
    t.includes("hipaa") ||
    t.includes("excel model")
  ) {
    return "Less than 1 month";
  }
  if (t.includes("12 weeks") || t.includes("android") || t.includes("design system") || t.includes("ehr rewrite")) {
    return "3–6 months";
  }
  return "1–3 months";
}

export const JOB_CATEGORIES = [
  "Web Development",
  "Mobile Development",
  "Design",
  "Writing",
  "Marketing",
  "Data",
  "Customer Support",
  "Product",
];

export function parseSkills(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
}

export function talentReady(user: {
  role: string;
  resumeUrl: string | null;
  linkedinUrl: string | null;
  avatarUrl?: string | null;
  skillTestPassed?: boolean;
  onboardingDone: boolean;
}) {
  if (user.role !== "TALENT") return { ok: false, reason: "Not a talent account." };
  if (!user.onboardingDone || !user.resumeUrl || !user.linkedinUrl || !user.avatarUrl) {
    return { ok: false, reason: "Finish your profile with a photo, resume, and LinkedIn." };
  }
  return { ok: true, reason: "" };
}

export function clientReady(user: {
  role: string;
  onboardingDone: boolean;
  companyName: string | null;
}) {
  if (user.role !== "CLIENT") return { ok: false, reason: "Not a client account." };
  if (!user.onboardingDone || !user.companyName) {
    return { ok: false, reason: "Complete company onboarding first." };
  }
  return { ok: true, reason: "" };
}
