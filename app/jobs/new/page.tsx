import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { STANDARD_CONNECT_COST } from "@/lib/constants";
import { NewJobForm } from "./new-job-form";

export default async function NewJobPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "CLIENT") redirect("/dashboard");
  if (!user.onboardingDone) redirect("/onboarding");

  return (
    <div className="mx-auto max-w-2xl px-5 py-12">
      <p className="text-xs uppercase tracking-[0.24em] text-copper">New brief</p>
      <h1 className="font-display mt-2 text-4xl">Post a job</h1>
      <p className="mt-3 text-muted">
        Standard jobs cost {STANDARD_CONNECT_COST} connects to apply. High-badge jobs cost 15–20 and
        require a Talent badge.
      </p>
      <NewJobForm />
    </div>
  );
}
