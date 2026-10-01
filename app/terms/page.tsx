import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="bg-paper pb-20 text-ink">
      <section className="border-b border-line bg-paper-2">
        <div className="mx-auto w-[92%] max-w-[760px] py-14 sm:py-16">
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#0db64b]">Legal</p>
          <h1 className="mt-3 text-[36px] font-bold tracking-[-0.04em] sm:text-[44px]">Terms of Service</h1>
          <p className="mt-4 text-[16px] leading-7 text-muted">Last updated September 20, 2026.</p>
        </div>
      </section>
      <article className="mx-auto w-[92%] max-w-[760px] space-y-6 pt-12 text-[15px] leading-7 text-muted">
        <p>
          These terms govern use of Wova, the job marketplace at wova.cc. By creating an account you agree to
          them.
        </p>
        <h2 className="text-[20px] font-semibold text-ink">Accounts</h2>
        <p>
          You must provide accurate information, keep your password private, and be at least 18. Clients post
          jobs and hire. Talent apply with connects, complete profiles, and may take a camera-on skill test.
        </p>
        <h2 className="text-[20px] font-semibold text-ink">Jobs, tests, and payments</h2>
        <p>
          Job posts and proposals must be truthful. Skill tests require a live camera so Wova can monitor the
          session. Connects and client payment methods are processed by Stripe when configured. Wova does not
          guarantee that any job will be filled or that any talent will be hired.
        </p>
        <h2 className="text-[20px] font-semibold text-ink">Acceptable use</h2>
        <p>
          Do not scrape the site, impersonate others, upload malware, or use the marketplace for unlawful work.
          We may suspend accounts that break these rules.
        </p>
        <h2 className="text-[20px] font-semibold text-ink">Contact</h2>
        <p>
          Questions:{" "}
          <Link href="/about" className="font-semibold text-[#0db64b] hover:underline">
            About Wova
          </Link>
          .
        </p>
      </article>
    </div>
  );
}
