import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TalentBadge } from "@/components/badges";
import { formatDate } from "@/lib/utils";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/dashboard");

  const [clients, talents, jobs, attempts] = await Promise.all([
    prisma.user.findMany({ where: { role: "CLIENT" }, orderBy: { createdAt: "desc" } }),
    prisma.user.findMany({ where: { role: "TALENT" }, orderBy: { createdAt: "desc" } }),
    prisma.job.findMany({ include: { client: true, _count: { select: { applications: true } } }, orderBy: { createdAt: "desc" } }),
    prisma.skillAttempt.findMany({ include: { talent: true }, orderBy: { startedAt: "desc" } }),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <p className="text-xs uppercase tracking-[0.24em] text-copper">Owner only</p>
      <h1 className="font-display mt-2 text-4xl">Monitor</h1>
      <p className="mt-2 text-muted">
        Full view of clients, talents, jobs, and skill tests. {clients.length} clients · {talents.length}{" "}
        talents · {jobs.length} jobs.
      </p>

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
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id} className="border-t border-line/70">
                  <td className="p-3">
                    {c.name}
                    <div className="text-xs text-muted">{c.email}</div>
                  </td>
                  <td className="p-3">{c.companyName}</td>
                  <td className="p-3">{c.companySize}</td>
                  <td className="p-3">{c.paymentConnected ? "Connected" : "—"}</td>
                  <td className="p-3">{formatDate(c.createdAt)}</td>
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
                <th className="p-3">Connects</th>
              </tr>
            </thead>
            <tbody>
              {talents.map((t) => (
                <tr key={t.id} className="border-t border-line/70">
                  <td className="p-3">
                    {t.name}
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
                  <td className="p-3">{t.connects}</td>
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
                    <td className="p-3">{a.cameraEnabled ? "On" : "Off"}</td>
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
