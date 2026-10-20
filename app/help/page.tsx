import type { Metadata } from "next";
import { CardGrid, PageHero, PageSection, PageShell } from "@/components/marketing-page";

export const metadata: Metadata = {
  title: "Help & support — Wova",
  description: "Answers for clients and talent using the Wova job marketplace.",
};

const faqs = [
  {
    title: "How do I post a job?",
    body: "Create a client account, finish company onboarding, then go to Post a job. Publishing a brief is free.",
  },
  {
    title: "How do I apply to a job?",
    body: "Create a talent profile, then open a job and submit a proposal. Each apply spends connects — 10 on most jobs, 15–20 on high-badge jobs.",
  },
  {
    title: "What is the skill test?",
    body: "A 20-minute, camera-on test with 10 questions. You must first record a 2–5 minute English introduction video. Passing at 70% earns a Talent badge.",
  },
  {
    title: "How do connects work?",
    body: "Connects are how talent apply. Buy a pack for $10 / 100 connects on the Connects page after you log in as talent.",
  },
  {
    title: "When do I get paid?",
    body: "Agree the work with the client, complete it, and get paid when the job is done. Wova does not take a surprise fee to post a job.",
  },
  {
    title: "I cannot sign in or verify email",
    body: "Check spam for the code from noreply@wova.cc. If GitHub or Google sign-in fails, use email signup or write to hello@wova.cc.",
  },
];

export default function HelpPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Resources"
        title="Help & support"
        lede="Short answers for the questions we hear most. If you are stuck on an account, job, or test, email hello@wova.cc."
        ctas={[{ href: "/contact", label: "Contact us" }]}
      />
      <PageSection title="Common questions">
        <CardGrid items={faqs} />
      </PageSection>
    </PageShell>
  );
}
