import type { Metadata } from "next";
import { CardGrid, PageHero, PageSection, PageShell } from "@/components/marketing-page";

export const metadata: Metadata = {
  title: "Careers — Wova",
  description: "Work at Wova. We hire through our own job marketplace.",
};

export default function CareersPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Company"
        title="Careers at Wova"
        lede="We hire the same way our clients do: a clear brief, a real profile, and proof of skill. Open roles are posted on Wova."
        ctas={[{ href: "/jobs", label: "See jobs on Wova" }]}
      />
      <PageSection title="How we hire">
        <CardGrid
          items={[
            {
              title: "Roles go on the marketplace",
              body: "When Wova is hiring, the job appears in Browse jobs like any other brief. Apply with a complete talent profile.",
            },
            {
              title: "Skill still matters",
              body: "Engineering, design, and ops roles expect the same bar we ask of everyone: a profile, and a skill test where it fits.",
            },
            {
              title: "No open role right now?",
              body: "Send hello@wova.cc a short note and a link to your Wova profile. We keep strong people in mind for the next seat.",
            },
          ]}
        />
      </PageSection>
    </PageShell>
  );
}
