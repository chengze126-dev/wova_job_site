import type { Metadata } from "next";
import { PageHero, PageSection, PageShell, StepList } from "@/components/marketing-page";

export const metadata: Metadata = {
  title: "How to find work on Wova",
  description: "Create a profile, pass the skill test, buy connects, and apply to freelance jobs.",
};

export default function HowToFindWorkPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="For talent"
        title="How to find work on Wova"
        lede="Finish your profile, prove your stack with a skill test, then apply with connects. Clients message people they want to hire."
        ctas={[{ href: "/signup?role=TALENT", label: "Create a profile" }]}
      />
      <PageSection title="From signup to first hire">
        <StepList
          items={[
            {
              title: "Create a talent account",
              body: "Sign up with email, GitHub, or Google. Verify your email, then complete onboarding with a photo, resume, LinkedIn, skills, and rate.",
            },
            {
              title: "Record an English introduction",
              body: "Before a skill test you record a 2–5 minute video in English. Admins can watch it. This is required to start the test.",
            },
            {
              title: "Pass the skill test",
              body: "Camera stays on. You get 20 minutes and 10 questions. Score 70% or higher to earn the Talent badge clients look for.",
            },
            {
              title: "Buy connects and apply",
              body: "Most jobs cost 10 connects to apply. High-badge jobs cost 15–20. Packs are $10 for 100 connects.",
            },
            {
              title: "Talk and get paid",
              body: "If a client shortlists you, you message on Wova. Do the work you agreed, then get paid when it is done.",
            },
          ]}
        />
      </PageSection>
    </PageShell>
  );
}
