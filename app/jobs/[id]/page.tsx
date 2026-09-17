import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { HighBadge, TalentBadge } from "@/components/badges";
import { ProfileAvatar } from "@/components/profile-avatar";
import { parseSkills, talentReady } from "@/lib/constants";
import { formatDate, formatMoney } from "@/lib/utils";
import { closeJob, updateApplicationStatus } from "@/app/actions/jobs";
import { startConversation } from "@/app/actions/messages";
import { SubmitButton } from "@/components/submit-button";
import { ApplyForm } from "@/components/apply-form";

export default async function JobDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ applied?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const job = await prisma.job.findUnique({
    where: { id },
    include: {
      client: true,
      applications: { include: { talent: true }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!job) notFound();
  const user = await getCurrentUser();
  const skills = parseSkills(job.skills);
  const isOwner = user?.id === job.clientId;
  const myApplication = user ? job.applications.find((a) => a.talentId === user.id) : null;
  const ready = user ? talentReady(user) : { ok: false, reason: "Sign in as talent to apply." };

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 lg:grid-cols-[1fr_320px]">
      <article>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
          <span>{job.category}</span>
          <span>·</span>
          <span>{formatDate(job.createdAt)}</span>
          {job.highBadge ? <HighBadge cost={job.connectCost} /> : <span>{job.connectCost} connects to apply</span>}
        </div>
        <h1 className="font-display mt-3 text-4xl leading-tight">{job.title}</h1>
        <p className="mt-3 text-muted">
          {job.client.companyName} · {job.client.companySize} · {job.client.companyIndustry}
        </p>
        {query.applied ? (
          <p className="mt-4 rounded-xl bg-pine/10 px-4 py-3 text-sm text-pine">Proposal sent. Connects were deducted.</p>
        ) : null}
        <div className="mt-6 whitespace-pre-wrap text-[15px] leading-7">{job.description}</div>
        <div className="mt-6 flex flex-wrap gap-2">
          {skills.map((skill) => (
            <span key={skill} className="rounded-full bg-paper-2 px-3 py-1 text-xs">
              {skill}
            </span>
          ))}
        </div>

        {user?.role === "TALENT" && job.status === "OPEN" ? (
          <section id="apply" className="mt-10 rounded-2xl border border-line bg-cream p-6">
            <h2 className="font-display text-2xl">Submit a proposal</h2>
            {myApplication ? (
              <div className="mt-3 text-sm text-muted">
                <p>You already applied. Status: {myApplication.status}.</p>
                {myApplication.attachmentUrl ? (
                  <a
                    href={myApplication.attachmentUrl}
                    className="mt-2 inline-block font-medium text-[#0aa542] underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {myApplication.attachmentName || "View attachment"}
                  </a>
                ) : null}
              </div>
            ) : !ready.ok ? (
              <p className="mt-3 text-sm text-muted">
                {ready.reason}{" "}
                <Link href={user.onboardingDone ? `/profile/${user.id}` : "/onboarding"} className="underline">
                  {user.onboardingDone ? "View profile" : "Finish your profile"}
                </Link>
              </p>
            ) : job.highBadge && !user.talentBadge ? (
              <p className="mt-3 text-sm text-muted">
                This job needs a Talent badge. The skill test is optional for other jobs.{" "}
                <Link href="/skill-test" className="underline">
                  Take the skill test
                </Link>
              </p>
            ) : (
              <ApplyForm jobId={job.id} connectCost={job.connectCost} balance={user.connects} />
            )}
          </section>
        ) : null}

        {isOwner ? (
          <section className="mt-10">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl">Proposals ({job.applications.length})</h2>
              {job.status === "OPEN" ? (
                <form action={closeJob.bind(null, job.id)}>
                  <button className="text-sm underline">Close job</button>
                </form>
              ) : null}
            </div>
            <ul className="mt-4 space-y-3">
              {job.applications.map((app) => (
                <li key={app.id} className="rounded-2xl border border-line bg-cream p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Link href={`/profile/${app.talent.id}`} className="flex items-center gap-2 font-medium">
                      <ProfileAvatar name={app.talent.name} src={app.talent.avatarUrl} size={28} badge={app.talent.talentBadge} />
                      {app.talent.name}
                      {app.talent.talentBadge ? <TalentBadge compact /> : null}
                    </Link>
                    <span className="text-xs text-muted">{app.status}</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted">{app.coverLetter}</p>
                  {app.attachmentUrl ? (
                    <a
                      href={app.attachmentUrl}
                      className="mt-2 inline-block text-sm font-medium text-[#0aa542] underline"
                      target="_blank"
                      rel="noreferrer"
                    >
                      {app.attachmentName || "Attachment"}
                    </a>
                  ) : (
                    <p className="mt-2 text-xs text-muted">No attachment</p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {app.status === "HIRED" ? (
                      <form action={startConversation.bind(null, app.talentId)}>
                        <button className="rounded-full border border-line px-3 py-1 text-xs">Message</button>
                      </form>
                    ) : null}
                    <form action={updateApplicationStatus.bind(null, app.id, "SHORTLISTED")}>
                      <SubmitButton className="!px-3 !py-1 text-xs">Shortlist</SubmitButton>
                    </form>
                    <form action={updateApplicationStatus.bind(null, app.id, "HIRED")}>
                      <SubmitButton className="!px-3 !py-1 text-xs">Hire</SubmitButton>
                    </form>
                    <form action={updateApplicationStatus.bind(null, app.id, "REJECTED")}>
                      <button className="rounded-full px-3 py-1 text-xs text-muted">Reject</button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </article>
      <aside className="h-fit rounded-2xl border border-line bg-cream p-5">
        <p className="text-sm text-muted">Budget</p>
        <p className="mt-1 text-xl font-medium">
          {job.budgetMin && job.budgetMax
            ? `${formatMoney(job.budgetMin * 100)}–${formatMoney(job.budgetMax * 100)}`
            : "On request"}
        </p>
        <p className="mt-1 text-xs text-muted">{job.budgetType === "hourly" ? "Hourly" : "Fixed price"}</p>
        <hr className="my-4 border-line" />
        <p className="text-sm">{job.client.name}</p>
        <p className="text-xs text-muted">{job.client.companyLocation}</p>
        {job.status === "OPEN" ? (
          <div className="mt-4 space-y-2">
            {!user ? (
              <Link
                href="/login"
                className="workora-cta block rounded-full bg-[#0db64b] px-4 py-2.5 text-center text-sm font-semibold transition hover:bg-[#0aa542]"
              >
                Apply now
              </Link>
            ) : user.role === "TALENT" ? (
              myApplication ? (
                <p className="rounded-full bg-[#e8f9ee] px-4 py-2.5 text-center text-sm font-semibold text-[#0aa542]">
                  Proposal submitted
                </p>
              ) : ready.ok ? (
                <a
                  href="#apply"
                  className="workora-cta block rounded-full bg-[#0db64b] px-4 py-2.5 text-center text-sm font-semibold transition hover:bg-[#0aa542]"
                >
                  Apply now
                </a>
              ) : (
                <Link
                  href="/dashboard"
                  className="workora-cta block rounded-full bg-[#0db64b] px-4 py-2.5 text-center text-sm font-semibold transition hover:bg-[#0aa542]"
                >
                  Finish setup to apply
                </Link>
              )
            ) : isOwner ? (
              <p className="text-sm text-muted">{job.applications.length} proposals on this job</p>
            ) : (
              <Link
                href="/jobs/new"
                className="workora-cta block rounded-full bg-[#0db64b] px-4 py-2.5 text-center text-sm font-semibold transition hover:bg-[#0aa542]"
              >
                Post a job
              </Link>
            )}
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted">This job is no longer accepting proposals.</p>
        )}
        {user?.role === "TALENT" && myApplication?.status === "HIRED" ? (
          <form action={startConversation.bind(null, job.clientId)} className="mt-3">
            <button
              type="submit"
              className="w-full rounded-full border border-line bg-cream px-4 py-2.5 text-sm font-semibold text-ink transition hover:border-[#0db64b]/40 hover:text-[#0aa542]"
            >
              Message client
            </button>
          </form>
        ) : user?.role === "TALENT" && myApplication && myApplication.status !== "HIRED" ? (
          <p className="mt-3 text-center text-xs text-muted">Messaging unlocks when your contract starts.</p>
        ) : null}
      </aside>
    </div>
  );
}
