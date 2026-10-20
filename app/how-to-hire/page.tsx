import type { Metadata } from "next";
import { CardGrid, PageHero, PageSection, PageShell, StepList } from "@/components/marketing-page";

export const metadata: Metadata = {
  title: "How to hire on Wova",
  description: "Post a job for free, review proposals from verified talent, and pay when the work is done.",
};

export default function HowToHirePage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="For clients"
        title="How to hire on Wova"
        lede="Posting a job is free. You review real proposals, talk in Wova messages, and pay when the work is done."
        ctas={[{ href: "/jobs/new", label: "Post a job" }]}
      />
      <PageSection title="The hiring path" lede="The same flow every client uses, from first brief to finished work.">
        <StepList
          items={[
            {
              title: "Create a client account",
              body: "Sign up, verify your email, and add your company. You need a company name before you can post.",
            },
            {
              title: "Post a job for free",
              body: "Write the brief, budget, skills, and whether it is full-time, part-time, contract, or temporary. There is no fee to publish.",
            },
            {
              title: "Review proposals",
              body: "Talent spend connects to apply, so you get considered fits instead of mass applications. Look for the Talent badge from a passed skill test.",
            },
            {
              title: "Message and hire",
              body: "Keep the conversation on Wova. Agree the work, then pay when it is done. No surprise fee to post the role.",
            },
          ]}
        />
      </PageSection>
      <PageSection title="What to look for">
        <CardGrid
          items={[
            { title: "Talent badge", body: "Optional camera-on skill tests. A pass at 70% or higher earns a badge you can trust on the profile." },
            { title: "Introduction video", body: "Before a skill test, talent record a 2–5 minute English introduction. Admins can review it." },
            { title: "Complete profiles", body: "Photo, resume, LinkedIn, skills, and rate. Incomplete profiles cannot apply to high-trust jobs." },
          ]}
        />
      </PageSection>
    </PageShell>
  );
}
