import type { Metadata } from "next";
import { CardGrid, PageHero, PageSection, PageShell } from "@/components/marketing-page";

export const metadata: Metadata = {
  title: "Enterprise hiring — Wova",
  description: "Hire verified talent across teams without a long agency process.",
};

export default function EnterprisePage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="For clients"
        title="Enterprise hiring"
        lede="Use Wova when you need more than one contractor. Post roles, search the talent marketplace, and keep every conversation in one place."
        ctas={[{ href: "/signup?role=CLIENT", label: "Start hiring" }]}
      />
      <PageSection title="Built for teams that hire often">
        <CardGrid
          items={[
            {
              title: "Post as many roles as you need",
              body: "Job posts are free. Open contract, full-time, part-time, or temporary briefs for design, engineering, data, and ops.",
            },
            {
              title: "Search verified talent",
              body: "Filter the marketplace by skills and look for the Talent badge from a passed skill test before you reach out.",
            },
            {
              title: "One workplace",
              body: "Jobs, proposals, and messages stay on Wova. Your hiring managers do not chase email threads across tools.",
            },
            {
              title: "Worldwide talent",
              body: "Hire remote specialists in the countries your team already works with. Pay when the agreed work is done.",
            },
            {
              title: "Serious applicants",
              body: "Talent spend connects to apply. That keeps proposals considered, which matters when you are filling several seats.",
            },
            {
              title: "Clear company profile",
              body: "Add company name, size, industry, and location during onboarding so talent know who they are applying to.",
            },
          ]}
        />
      </PageSection>
    </PageShell>
  );
}
