import type { Metadata } from "next";
import { CardGrid, PageHero, PageSection, PageShell } from "@/components/marketing-page";

export const metadata: Metadata = {
  title: "Press — Wova",
  description: "Facts, leadership, and press contact for the Wova job marketplace.",
};

export default function PressPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Company"
        title="Press"
        lede="Wova is a job marketplace at wova.cc. Clients post work for free. Talent apply with connects and can earn a Talent badge from a skill test."
        ctas={[{ href: "mailto:hello@wova.cc?subject=Press%20inquiry", label: "Press inquiries" }]}
      />
      <PageSection title="Boilerplate">
        <div className="rounded-2xl border border-line bg-cream px-6 py-6 text-[15px] leading-7 text-muted">
          <p>
            Wova is a job marketplace for clients and independent talent. Posting a job is free. Talent build a
            profile, record an English introduction, and may take a camera-on skill test. A passing score earns a
            Talent badge. Proposals use connects so applications stay considered. Messages and hiring stay on Wova.
            Pay when the work is done.
          </p>
        </div>
      </PageSection>
      <PageSection title="Facts at a glance">
        <CardGrid
          items={[
            { title: "Product", body: "Job posts, talent profiles, skill tests, connects, and in-app messages." },
            { title: "Leadership", body: "Dieudonne Awa, CEO. Tim Demars, CTO. Full bios on the About page." },
            { title: "Domain", body: "wova.cc and www.wova.cc. Logo files are the site favicon and /logo.png." },
            { title: "Contact", body: "Journalists: hello@wova.cc with subject “Press inquiry”." },
          ]}
        />
      </PageSection>
    </PageShell>
  );
}
