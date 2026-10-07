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
      <p className="text-xs uppercase tracking-[0.24em] text-pine">Required introduction</p>
      <h1 className="font-display mt-2 text-4xl">Skill test</h1>
      <p className="mt-3 max-w-2xl text-muted">
        Record a 2–5 minute English introduction first. Then choose one of {SKILL_STACKS.length} stacks. Each
        test shows {QUESTIONS_PER_TEST} questions from {PROBLEMS_PER_STACK.toLocaleString()} problems. Your camera
        must stay on so an admin can watch. Pass at 70% and a Talent badge is added next to your photo.
      </p>
      <SkillTestClient introVideoUrl={user.introVideoUrl} introVideoSeconds={user.introVideoSeconds} />
    </div>
  );
}
