import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { SkillTestClient } from "@/components/skill-test-client";
import { PROBLEMS_PER_STACK, QUESTIONS_PER_TEST, SKILL_STACKS } from "@/lib/skill-stacks";

export default async function SkillTestPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "TALENT") redirect("/dashboard");
  if (!user.onboardingDone) redirect("/onboarding");

  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      <p className="text-xs uppercase tracking-[0.24em] text-pine">Optional exam</p>
      <h1 className="font-display mt-2 text-4xl">Skill test</h1>
      <p className="mt-3 max-w-2xl text-muted">
        Choose one of {SKILL_STACKS.length} main stacks. Each stack has {PROBLEMS_PER_STACK.toLocaleString()}{" "}
        problems. Every test shows {QUESTIONS_PER_TEST} questions. Turn the camera on, pass at 70%, and a
        Talent badge is added next to your photo.
      </p>
      <SkillTestClient />
    </div>
  );
}
