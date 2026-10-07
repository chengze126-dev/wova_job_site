import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="bg-paper pb-20 text-ink">
      <section className="border-b border-line bg-paper-2">
        <div className="mx-auto w-[92%] max-w-[760px] py-14 sm:py-16">
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#0db64b]">Legal</p>
          <h1 className="mt-3 text-[36px] font-bold tracking-[-0.04em] sm:text-[44px]">Privacy Policy</h1>
          <p className="mt-4 text-[16px] leading-7 text-muted">Last updated September 20, 2026.</p>
        </div>
      </section>
      <article className="mx-auto w-[92%] max-w-[760px] space-y-6 pt-12 text-[15px] leading-7 text-muted">
        <p>
          Wova collects the information you submit to run the marketplace: name, email, profile, job posts,
          proposals, and skill-test activity.
        </p>
        <h2 className="text-[20px] font-semibold text-ink">What we collect</h2>
        <p>
          Account details, profile photos and resumes you upload, messages, payment records from Stripe, a live
          camera snapshot during skill tests so an admin can monitor the session, and an English introduction
          video recorded before a skill test.
        </p>
        <h2 className="text-[20px] font-semibold text-ink">How we use it</h2>
        <p>
          To operate hiring, verify email, score skill tests, show admins live camera state during tests, and
          process connects or client billing. We do not sell personal information.
        </p>
        <h2 className="text-[20px] font-semibold text-ink">Processors</h2>
        <p>
          Email may be sent with Resend. Payments use Stripe. Hosting may be on Vercel. Those providers process
          data only to provide their service.
        </p>
        <h2 className="text-[20px] font-semibold text-ink">Contact</h2>
        <p>
          Privacy questions:{" "}
          <Link href="/about" className="font-semibold text-[#0db64b] hover:underline">
            About Wova
          </Link>
          .
        </p>
      </article>
    </div>
  );
}
