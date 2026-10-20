import type { Metadata } from "next";
import { PageHero, PageSection, PageShell } from "@/components/marketing-page";

export const metadata: Metadata = {
  title: "Success stories — Wova",
  description: "How clients and talent hire, apply, and get work done on Wova.",
};

const stories = [
  {
    quote: "I hired a verified designer in two days. The skill badge made the shortlist obvious.",
    name: "Jordan Hale",
    role: "Founder, Northfield",
    detail: "Posted a design-systems brief, filtered for the Talent badge, and hired from the first round of proposals.",
  },
  {
    quote: "The skill test felt serious. After I passed, clients started answering my proposals.",
    name: "Maya Chen",
    role: "Product designer",
    detail: "Finished her profile, recorded the English intro, passed the camera-on test, then applied with connects.",
  },
  {
    quote: "We staffed a billing audit without a long agency process. Wova kept it simple.",
    name: "Priya Raman",
    role: "Ops lead",
    detail: "Used a free job post and in-app messages instead of a third-party recruiter for a finance-ops contract.",
  },
  {
    quote: "Remote did not mean anonymous. I could see country, rate, and the badge before I wrote.",
    name: "Chris Adeyemi",
    role: "Engineering manager",
    detail: "Hired a TypeScript developer through the talent marketplace after reviewing a passed skill test.",
  },
];

export default function StoriesPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Resources"
        title="Success stories"
        lede="Clients hire faster when proposals are real. Talent get replies after they prove the work."
      />
      <PageSection title="From the marketplace">
        <div className="grid gap-4 md:grid-cols-2">
          {stories.map((story) => (
            <figure key={story.name} className="rounded-2xl border border-line bg-cream px-6 py-6">
              <blockquote className="text-[16px] leading-7 text-ink/90">“{story.quote}”</blockquote>
              <p className="mt-4 text-[14px] leading-6 text-muted">{story.detail}</p>
              <figcaption className="mt-5">
                <p className="text-[14px] font-semibold text-ink">{story.name}</p>
                <p className="mt-0.5 text-[12px] text-muted">{story.role}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </PageSection>
    </PageShell>
  );
}
