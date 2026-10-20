import type { Metadata } from "next";
import { CardGrid, PageHero, PageSection, PageShell } from "@/components/marketing-page";

export const metadata: Metadata = {
  title: "Contact Wova",
  description: "Reach Wova for hiring help, talent support, press, or trust questions.",
};

export default function ContactPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Company"
        title="Contact us"
        lede="Wova is a job marketplace. Write to the inbox that matches your question and we will get back to you by email."
      />
      <PageSection title="Email">
        <CardGrid
          items={[
            {
              title: "General",
              body: "Accounts, partnerships, and anything that does not fit below. hello@wova.cc",
              href: "mailto:hello@wova.cc",
            },
            {
              title: "Help & support",
              body: "Jobs, proposals, skill tests, connects, or billing. Include the email on your Wova account.",
              href: "mailto:hello@wova.cc?subject=Wova%20support",
            },
            {
              title: "Press",
              body: "Interviews, logos, and product facts for journalists.",
              href: "/press",
            },
            {
              title: "Trust & safety",
              body: "Report a job, profile, or test session that looks unsafe or fake.",
              href: "mailto:hello@wova.cc?subject=Trust%20and%20safety",
            },
            {
              title: "Careers",
              body: "Wova hires through Wova. See open roles, or send a note if none match.",
              href: "/careers",
            },
            {
              title: "Legal",
              body: "Terms of Service and Privacy Policy govern accounts, tests, and payments.",
              href: "/terms",
            },
          ]}
        />
      </PageSection>
    </PageShell>
  );
}
