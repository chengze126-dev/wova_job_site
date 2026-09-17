import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { SkillTestClient } from "@/components/skill-test-client";

export default async function SkillTestPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "TALENT") redirect("/dashboard");
  if (!user.onboardingDone) redirect("/onboarding");
  if (user.skillTestPassed) redirect(`/profile/${user.id}`);

  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      <p className="text-xs uppercase tracking-[0.24em] text-pine">Optional exam</p>
      <h1 className="font-display mt-2 text-4xl">Skill test</h1>
      <p className="mt-3 max-w-2xl text-muted">
        Optional after your profile is live. Turn on your camera before you start and keep it on.
        You will answer multiple-choice questions and write JavaScript functions. Coding answers are
        scored by matching return values to hidden tests. Pass at 70% and a Talent badge is added to
        your profile.
      </p>
      <SkillTestClient />
    </div>
  );
}
