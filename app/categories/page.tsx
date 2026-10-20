import type { Metadata } from "next";
import { JOB_CATEGORIES } from "@/lib/constants";
import { CardGrid, PageHero, PageSection, PageShell } from "@/components/marketing-page";

export const metadata: Metadata = {
  title: "Browse categories — Wova",
  description: "Find freelance jobs and talent by category on Wova.",
};

const copy: Record<string, string> = {
  "Web Development": "Front-end, back-end, and full-stack work on the web — Next.js, APIs, and product sites.",
  "Mobile Development": "iOS, Android, and cross-platform apps for clients who need a build or a rescue.",
  Design: "Product, brand, and UI/UX. Design systems and the screens that ship with them.",
  Writing: "Case studies, product copy, and B2B content from writers who can sit with a brief.",
  Marketing: "Campaigns, SEO, and launch work for teams that need extra hands this quarter.",
  Data: "Dashboards, models, and ops reporting — from spreadsheets to production pipelines.",
  "Customer Support": "Inbox, chat, and customer ops for products that cannot leave people waiting.",
  Product: "Product managers and operators who can write a spec, run a sprint, and ship.",
};

export default function CategoriesPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Resources"
        title="Browse categories"
        lede="Open jobs and talent by the fields hiring most on Wova. Pick a category to search live briefs."
      />
      <PageSection title="Hire or apply by field">
        <CardGrid
          items={JOB_CATEGORIES.map((name) => ({
            title: name,
            body: copy[name] ?? "Open roles and independent talent in this field.",
            href: `/jobs?q=${encodeURIComponent(name)}`,
          }))}
        />
      </PageSection>
    </PageShell>
  );
}
