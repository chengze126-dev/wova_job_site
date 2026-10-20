import type { Metadata } from "next";
import { CardGrid, PageHero, PageSection, PageShell } from "@/components/marketing-page";

export const metadata: Metadata = {
  title: "Accessibility — Wova",
  description: "How Wova aims to keep the job marketplace usable.",
};

export default function AccessibilityPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Company"
        title="Accessibility"
        lede="Wova should be usable with a keyboard, a screen reader, and a clear visual theme. If something blocks you from hiring or applying, tell us."
        ctas={[{ href: "mailto:hello@wova.cc?subject=Accessibility", label: "Report a barrier" }]}
      />
      <PageSection title="What we aim for">
        <CardGrid
          items={[
            {
              title: "Keyboard and labels",
              body: "Forms, search, and navigation should work without a mouse. Inputs have visible labels.",
            },
            {
              title: "Contrast and themes",
              body: "A light and dark theme ship with the site. Body text sits on a paper background, not on the photo.",
            },
            {
              title: "Media",
              body: "Hero and how-it-works video should not autoplay with sound. Skill-test camera access is required only for the test itself.",
            },
            {
              title: "Feedback",
              body: "Email hello@wova.cc with the page URL, the browser you use, and what you could not do. We treat that as a product bug.",
            },
          ]}
        />
      </PageSection>
    </PageShell>
  );
}
