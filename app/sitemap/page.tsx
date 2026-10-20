import type { Metadata } from "next";
import Link from "next/link";
import { PageHero, PageSection, PageShell } from "@/components/marketing-page";

export const metadata: Metadata = {
  title: "Sitemap — Wova",
  description: "All public pages on the Wova job marketplace.",
};

const groups = [
  {
    title: "Marketplace",
    links: [
      { href: "/jobs", label: "Find freelance jobs" },
      { href: "/jobs/new", label: "Post a job" },
      { href: "/talents", label: "Talent Marketplace" },
      { href: "/companies", label: "Companies" },
      { href: "/skill-test", label: "Skill test" },
      { href: "/connects", label: "Buy connects" },
    ],
  },
  {
    title: "For clients",
    links: [
      { href: "/how-to-hire", label: "How to hire" },
      { href: "/enterprise", label: "Enterprise hiring" },
      { href: "/hire-worldwide", label: "Hire worldwide" },
      { href: "/signup?role=CLIENT", label: "Client signup" },
    ],
  },
  {
    title: "For talent",
    links: [
      { href: "/how-to-find-work", label: "How to find work" },
      { href: "/career-guidance", label: "Career guidance" },
      { href: "/signup?role=TALENT", label: "Create a profile" },
    ],
  },
  {
    title: "Resources",
    links: [
      { href: "/help", label: "Help & support" },
      { href: "/stories", label: "Success stories" },
      { href: "/why-wova", label: "Why Wova" },
      { href: "/categories", label: "Browse categories" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About us" },
      { href: "/contact", label: "Contact us" },
      { href: "/trust", label: "Trust, safety & security" },
      { href: "/careers", label: "Careers" },
      { href: "/press", label: "Press" },
      { href: "/accessibility", label: "Accessibility" },
      { href: "/terms", label: "Terms of Service" },
      { href: "/privacy", label: "Privacy Policy" },
    ],
  },
];

export default function SitemapPage() {
  return (
    <PageShell>
      <PageHero eyebrow="Company" title="Sitemap" lede="Every public page on Wova, grouped the way the footer is." />
      <PageSection title="Pages">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <div key={group.title}>
              <p className="text-[15px] font-semibold">{group.title}</p>
              <ul className="mt-3 space-y-2">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-[14px] text-[#16a34a] hover:underline">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </PageSection>
    </PageShell>
  );
}
