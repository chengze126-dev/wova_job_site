import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TalentBadge } from "@/components/badges";
import { formatDate, formatMoney } from "@/lib/utils";
import { isAdminEmail } from "@/lib/admin";
import { AdminLiveSkillMonitor } from "@/components/admin-live-skill-monitor";
import { startConversation } from "@/app/actions/messages";
import { payoutAvailableBalance } from "@/app/actions/admin-payouts";
import { SubmitButton } from "@/components/submit-button";
import { getStripeUsdBalance, stripeEnabled } from "@/lib/stripe";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ payout?: string; payout_error?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN" || !isAdminEmail(user.email)) redirect("/dashboard");

  const params = await searchParams;
  const [clients, talents, jobs, attempts, purchases, stripeBalance] = await Promise.all([
    prisma.user.findMany({ where: { role: "CLIENT" }, orderBy: { createdAt: "desc" } }),
    prisma.user.findMany({ where: { role: "TALENT" }, orderBy: { createdAt: "desc" } }),
    prisma.job.findMany({ include: { client: true, _count: { select: { applications: true } } }, orderBy: { createdAt: "desc" } }),
    prisma.skillAttempt.findMany({ include: { talent: true }, orderBy: { startedAt: "desc" } }),
    prisma.connectPurchase.findMany({ orderBy: { createdAt: "desc" }, take: 40 }),
    getStripeUsdBalance(),
  ]);
  const paidPurchases = purchases.filter((purchase) => purchase.status === "completed");
  const paidCents = paidPurchases.reduce((sum, purchase) => sum + purchase.amountCents, 0);
  const talentById = new Map(talents.map((talent) => [talent.id, talent]));

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <p className="text-xs uppercase tracking-[0.24em] text-copper">Owner only</p>
      <h1 className="font-display mt-2 text-4xl">Monitor</h1>
      <p className="mt-2 text-muted">
        Open any client or developer profile and send a DM. {clients.length} clients · {talents.length}{" "}
        talents · {jobs.length} jobs.
      </p>

      <section className="mt-10">
        <h2 className="font-display text-3xl">Connect sales</h2>
        <p className="mt-1 text-sm text-muted">
          When a developer buys connects, Stripe charges their card into the Wova Stripe account. Send available
          balance to the bank you added in Stripe.
        </p>
        {!stripeEnabled() ? (
          <p className="mt-3 rounded-2xl border border-line bg-cream p-4 text-sm text-muted">
            Set STRIPE_SECRET_KEY on Vercel to collect real payments. Until then, local buys are demo credits only.
          </p>
        ) : null}
        {params.payout ? (
          <p className="mt-3 rounded-xl bg-pine/10 px-4 py-3 text-sm text-pine">
            Payout sent. Stripe will deposit it to your bank, usually in 1–3 business days.
          </p>
        ) : null}
        {params.payout_error ? (
          <p className="mt-3 rounded-xl bg-copper/10 px-4 py-3 text-sm text-copper-dark">{params.payout_error}</p>
        ) : null}
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-line bg-cream p-4">
            <p className="text-xs uppercase tracking-wider text-muted">Completed on Wova</p>
            <p className="mt-1 text-2xl font-semibold">{formatMoney(paidCents)}</p>
            <p className="mt-1 text-xs text-muted">{paidPurchases.length} paid packs</p>
          </div>
          <div className="rounded-2xl border border-line bg-cream p-4">
            <p className="text-xs uppercase tracking-wider text-muted">Stripe available</p>
            <p className="mt-1 text-2xl font-semibold">
              {stripeBalance ? formatMoney(stripeBalance.availableCents) : "—"}
            </p>
            <p className="mt-1 text-xs text-muted">Ready to send to your bank</p>
          </div>
          <div className="rounded-2xl border border-line bg-cream p-4">
            <p className="text-xs uppercase tracking-wider text-muted">Stripe pending</p>
            <p className="mt-1 text-2xl font-semibold">
              {stripeBalance ? formatMoney(stripeBalance.pendingCents) : "—"}
            </p>
            <p className="mt-1 text-xs text-muted">New charges waiting on Stripe</p>
          </div>
        </div>
        <form action={payoutAvailableBalance} className="mt-4">
          <SubmitButton>Send available balance to my bank</SubmitButton>
        </form>
        {purchases.length === 0 ? (
          <p className="mt-4 text-sm text-muted">No connect purchases yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-2xl border border-line bg-cream">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="border-b border-line text-xs uppercase tracking-wider text-muted">
                <tr>
                  <th className="p-3">Developer</th>
                  <th className="p-3">Pack</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map((purchase) => {
                  const talent = talentById.get(purchase.talentId);
                  return (
                    <tr key={purchase.id} className="border-t border-line/70">
                      <td className="p-3">
                        {talent ? (
                          <>
                            <span className="font-medium">{talent.name}</span>
                            <div className="text-xs text-muted">{talent.email}</div>
                          </>
                        ) : (
                          purchase.talentId
                        )}
                      </td>
                      <td className="p-3">{purchase.connects} connects</td>
                      <td className="p-3">{formatMoney(purchase.amountCents)}</td>
                      <td className="p-3">{purchase.status}</td>
                      <td className="p-3">{formatDate(purchase.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <AdminLiveSkillMonitor />

      <section className="mt-10">
        <h2 className="font-display text-3xl">Introduction videos</h2>
        <p className="mt-1 text-sm text-muted">
          Developers must record a 2–5 minute English introduction before the tech skill test. Watch each video here.
        </p>
        {talents.filter((t) => t.introVideoUrl).length === 0 ? (
          <p className="mt-3 rounded-2xl border border-line bg-cream p-4 text-sm text-muted">
            No introduction videos yet.
          </p>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {talents
              .filter((t) => t.introVideoUrl)
              .map((t) => (
                <article key={t.id} className="rounded-2xl border border-line bg-cream p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link href={`/profile/${t.id}`} className="font-semibold text-pine hover:underline">
                        {t.name}
                      </Link>
                      <p className="text-xs text-muted">{t.email}</p>
                    </div>
                    <p className="text-xs text-muted">
                      {Math.floor((t.introVideoSeconds || 0) / 60)}:{String((t.introVideoSeconds || 0) % 60).padStart(2, "0")}
                    </p>
                  </div>
                  <video src={t.introVideoUrl || ""} controls preload="none" className="mt-3 w-full rounded-xl bg-black" />
                </article>
              ))}
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-display text-3xl">Clients</h2>
        <div className="mt-3 overflow-x-auto rounded-2xl border border-line bg-cream">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-line text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="p-3">Name</th>
                <th className="p-3">Company</th>
                <th className="p-3">Size</th>
                <th className="p-3">Payment</th>
                <th className="p-3">Joined</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id} className="border-t border-line/70">
                  <td className="p-3">
                    <Link href={`/profile/${c.id}`} className="font-medium text-pine hover:underline">
                      {c.name}
                    </Link>
                    <div className="text-xs text-muted">{c.email}</div>
                  </td>
                  <td className="p-3">{c.companyName}</td>
                  <td className="p-3">{c.companySize}</td>
                  <td className="p-3">{c.paymentConnected ? "Connected" : "—"}</td>
                  <td className="p-3">{formatDate(c.createdAt)}</td>
                  <td className="p-3 text-right">
                    <form action={startConversation.bind(null, c.id)}>
                      <SubmitButton className="!rounded-full !bg-[#14a800] !px-3 !py-1.5 !text-xs">DM</SubmitButton>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-3xl">Talents</h2>
        <div className="mt-3 overflow-x-auto rounded-2xl border border-line bg-cream">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-line text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="p-3">Name</th>
                <th className="p-3">Phone</th>
                <th className="p-3">LinkedIn / resume</th>
                <th className="p-3">Badge</th>
                <th className="p-3">Skill test</th>
                <th className="p-3">Intro video</th>
                <th className="p-3">Connects</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {talents.map((t) => (
                <tr key={t.id} className="border-t border-line/70">
                  <td className="p-3">
                    <Link href={`/profile/${t.id}`} className="font-medium text-pine hover:underline">
                      {t.name}
                    </Link>
                    <div className="text-xs text-muted">{t.email}</div>
                  </td>
                  <td className="p-3">
                    {t.phone || "—"}
                  </td>
                  <td className="p-3 text-xs">
                    {t.linkedinUrl ? "LinkedIn · " : "No LinkedIn · "}
                    {t.resumeUrl ? "resume" : "no resume"}
                  </td>
                  <td className="p-3">{t.talentBadge ? <TalentBadge compact /> : "—"}</td>
                  <td className="p-3">{t.skillTestPassed ? "Passed" : "Not passed"}</td>
                  <td className="p-3">
                    {t.introVideoUrl ? (
                      <div className="w-44">
                        <video
                          src={t.introVideoUrl}
                          controls
                          preload="none"
                          className="h-24 w-full rounded-lg bg-black"
                        />
                        <p className="mt-1 text-[11px] text-muted">
                          {Math.floor((t.introVideoSeconds || 0) / 60)}:{String((t.introVideoSeconds || 0) % 60).padStart(2, "0")} English intro
                        </p>
                      </div>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="p-3">{t.connects}</td>
                  <td className="p-3 text-right">
                    <form action={startConversation.bind(null, t.id)}>
                      <SubmitButton className="!rounded-full !bg-[#14a800] !px-3 !py-1.5 !text-xs">DM</SubmitButton>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-3xl">Jobs</h2>
        <ul className="mt-3 divide-y divide-line rounded-2xl border border-line bg-cream">
          {jobs.map((job) => (
            <li key={job.id} className="flex flex-wrap justify-between gap-2 p-4 text-sm">
              <span>
                {job.title}
                <span className="text-muted"> · {job.client.companyName}</span>
              </span>
              <span className="text-muted">
                {job.status} · {job.connectCost} connects · {job._count.applications} proposals
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-3xl">Skill tests</h2>
        <p className="mt-1 text-sm text-muted">
          Open a developer’s attempt to see score, multiple-choice answers, and coding results.
        </p>
        {attempts.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-line bg-cream p-4 text-sm text-muted">
            No skill tests have been started yet.
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-2xl border border-line bg-cream">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-line text-xs uppercase tracking-wider text-muted">
                <tr>
                  <th className="p-3">Developer</th>
                  <th className="p-3">Score</th>
                  <th className="p-3">Result</th>
                  <th className="p-3">Camera</th>
                  <th className="p-3">Started</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {attempts.map((a) => (
                  <tr key={a.id} className="border-t border-line/70">
                    <td className="p-3">
                      {a.talent?.name || "Unknown talent"}
                      <div className="text-xs text-muted">{a.talent?.email}</div>
                    </td>
                    <td className="p-3">{a.completedAt && a.score != null ? `${a.score}%` : "—"}</td>
                    <td className="p-3">
                      {a.completedAt ? (a.passed ? "Pass" : "Fail") : "In progress"}
                    </td>
                    <td className="p-3">
                      {a.completedAt
                        ? a.cameraEnabled
                          ? "On"
                          : "Off"
                        : a.cameraOn
                          ? "On"
                          : "Off"}
                    </td>
                    <td className="p-3">{formatDate(a.startedAt)}</td>
                    <td className="p-3 text-right">
                      <Link href={`/admin/skill-tests/${a.id}`} className="font-medium text-pine hover:underline">
                        View result
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
