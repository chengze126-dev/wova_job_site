import type { Metadata } from "next";
import { CardGrid, PageHero, PageSection, PageShell } from "@/components/marketing-page";

export const metadata: Metadata = {
  title: "Why Wova",
  description: "A job marketplace for verified talent, fair proposals, and clear pay.",
};

export default function WhyWovaPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Resources"
        title="Why Wova"
        lede="Built for hiring managers and independent talent — not a generic job board that dumps a thousand unread CVs."
        ctas={[{ href: "/signup", label: "Join Wova" }]}
      />
      <PageSection title="What is different">
        <CardGrid
          items={[
            {
              title: "Verified talent",
              body: "Optional skill tests with a live camera and an English introduction video. Pass and you get a Talent badge clients can see.",
            },
            {
              title: "Fair proposals",
              body: "Talent spend connects to apply. Every proposal costs something, so clients read people who meant to apply.",
            },
            {
              title: "Clear pay",
              body: "Agree the work, then pay when the job is done. There is no fee to post a job.",
            },
            {
              title: "One place to work",
              body: "Jobs, profiles, skill tests, and messages stay on Wova from first search to hire.",
            },
            {
              title: "Free to post",
              body: "Clients publish briefs without a listing fee. You pay for completed work, not for putting the role online.",
            },
            {
              title: "Worldwide by default",
              body: "Remote roles and country on every profile. Hire the person who can do the work, not only the person next door.",
            },
          ]}
        />
      </PageSection>
    </PageShell>
  );
}
