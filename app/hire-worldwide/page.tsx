import type { Metadata } from "next";
import { COUNTRIES } from "@/lib/constants";
import { CardGrid, PageHero, PageSection, PageShell } from "@/components/marketing-page";

export const metadata: Metadata = {
  title: "Hire worldwide — Wova",
  description: "Find remote talent across countries and time zones on Wova.",
};

export default function HireWorldwidePage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="For clients"
        title="Hire worldwide"
        lede="Wova is built for remote work. Post a role once and review talent from the countries listed on every profile."
        ctas={[{ href: "/talents", label: "Search talent" }]}
      />
      <PageSection title="Why clients hire globally here">
        <CardGrid
          items={[
            {
              title: "Remote-first briefs",
              body: "Mark the job remote in the location field. Talent filter for remote work the same way they search by skill.",
            },
            {
              title: "Country on every profile",
              body: "Talent set a country during signup. You see it on the profile before you message or hire.",
            },
            {
              title: "Same trust bar everywhere",
              body: "Skill tests, English introduction videos, and the Talent badge work the same whether someone is in Austin or Nairobi.",
            },
          ]}
        />
      </PageSection>
      <PageSection
        title="Countries talent can list"
        lede="These are the locations available on Wova profiles today."
      >
        <div className="columns-2 gap-x-10 text-[14px] leading-7 text-muted sm:columns-3 lg:columns-4">
          {COUNTRIES.filter((country) => country !== "Other").map((country) => (
            <p key={country}>{country}</p>
          ))}
        </div>
      </PageSection>
    </PageShell>
  );
}
