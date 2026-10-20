import type { Metadata } from "next";
import { CardGrid, PageHero, PageSection, PageShell } from "@/components/marketing-page";

export const metadata: Metadata = {
  title: "Trust, safety & security — Wova",
  description: "How Wova keeps hiring, skill tests, and payments on the level.",
};

export default function TrustPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Company"
        title="Trust, safety & security"
        lede="Wova is a hiring marketplace. We verify email, watch skill tests with a live camera, and process payments through Stripe."
        ctas={[{ href: "/contact", label: "Report a problem" }]}
      />
      <PageSection title="How we keep the marketplace honest">
        <CardGrid
          items={[
            {
              title: "Verified accounts",
              body: "Email codes before you hire or apply. GitHub and Google sign-in are available. You must be 18.",
            },
            {
              title: "Camera-on skill tests",
              body: "Tests run with the camera on so an admin can see the session. A still frame and heartbeat keep the attempt live.",
            },
            {
              title: "English introduction video",
              body: "Talent record 2–5 minutes in English before the test starts. Admins can watch that video on the talent record.",
            },
            {
              title: "Talent badge",
              body: "A score of 70% or higher on the skill test adds a badge clients use when they shortlist.",
            },
            {
              title: "Connects on proposals",
              body: "Applying costs connects. That cuts spam so clients are not buried in copy-paste cover letters.",
            },
            {
              title: "Payments",
              body: "Connect packs and client billing go through Stripe when it is configured. Wova does not store full card numbers.",
            },
            {
              title: "Acceptable use",
              body: "No scraping, impersonation, malware, or unlawful work. We can suspend accounts that break the rules.",
            },
            {
              title: "Report abuse",
              body: "If a job, profile, or message looks wrong, email hello@wova.cc with the URL and what you saw.",
            },
          ]}
        />
      </PageSection>
      <PageSection title="Policies">
        <CardGrid
          items={[
            { title: "Terms of Service", body: "Accounts, jobs, tests, and payments.", href: "/terms" },
            { title: "Privacy Policy", body: "What we collect, including camera frames and intro videos.", href: "/privacy" },
            { title: "Accessibility", body: "How we aim to keep Wova usable.", href: "/accessibility" },
          ]}
        />
      </PageSection>
    </PageShell>
  );
}
