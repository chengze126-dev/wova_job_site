import type { Metadata } from "next";
import { CardGrid, PageHero, PageSection, PageShell } from "@/components/marketing-page";

export const metadata: Metadata = {
  title: "Career guidance — Wova",
  description: "How to win freelance jobs on Wova: profile, skill test, and proposals.",
};

export default function CareerGuidancePage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Resources"
        title="Career guidance"
        lede="Practical steps for talent who want replies — not another empty apply. Wova rewards complete profiles and proven skill."
        ctas={[{ href: "/signup?role=TALENT", label: "Create a profile" }]}
      />
      <PageSection title="What actually gets you hired">
        <CardGrid
          items={[
            {
              title: "Finish the profile",
              body: "Photo, resume, LinkedIn, skills, and a real rate. Clients skip empty profiles, and incomplete ones cannot apply to high-trust jobs.",
            },
            {
              title: "Speak clearly on video",
              body: "The 2–5 minute English introduction is your first impression. Say who you are, what you ship, and the work you want.",
            },
            {
              title: "Pass the skill test",
              body: "Camera on, 20 minutes, 10 questions, 70% to pass. The Talent badge is the fastest way to stand out in a proposal list.",
            },
            {
              title: "Spend connects on fit",
              body: "Do not spray 100 jobs. Read the brief, match the skills, and write a short cover that names the actual work.",
            },
            {
              title: "Stay on Wova messages",
              body: "Clients hire people they can reach. Answer on the thread, agree scope, and keep files attached to the job.",
            },
            {
              title: "Price the job, not your ego",
              body: "Set an hourly or project rate you can keep. Overpricing a first Wova job is how good profiles sit unread.",
            },
          ]}
        />
      </PageSection>
    </PageShell>
  );
}
