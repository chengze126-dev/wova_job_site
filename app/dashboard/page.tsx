import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { JobCard } from "@/components/job-card";
import { TalentBadge } from "@/components/badges";
import { ProfileAvatar } from "@/components/profile-avatar";
import { talentReady } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { updateApplicationStatus } from "@/app/actions/jobs";
import { startConversation } from "@/app/actions/messages";
import { SubmitButton } from "@/components/submit-button";

export default async function DashboardPage() {
  try {
    return await renderDashboard();
  } catch (error) {
    const digest =
      typeof error === "object" && error && "digest" in error ? String((error as { digest?: string }).digest) : "";
    if (digest.includes("NEXT_REDIRECT") || digest.includes("NEXT_NOT_FOUND")) throw error;
    console.error("Dashboard failed", error);
    return (
      <div className="mx-auto max-w-md px-5 py-24 text-center">
        <h1 className="text-2xl font-bold">Dashboard could not load</h1>
        <p className="mt-3 text-sm text-muted">
          Reload the page. If this keeps happening, log in again with a demo account.
        </p>
        <Link href="/login" className="mt-6 inline-flex rounded-full bg-[#0db64b] px-5 py-2 text-sm font-semibold text-white">
          Back to login
        </Link>
      </div>
    );
  }
}

async function renderDashboard() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "ADMIN") redirect("/admin");
  if (!user.onboardingDone) redirect("/onboarding");

  const marketplaceJobs = await prisma.job.findMany({
    where: { status: "OPEN" },
    include: { client: true, _count: { select: { applications: true } } },
    orderBy: { createdAt: "desc" },
  });

  if (user.role === "CLIENT") {
    const jobs = await prisma.job.findMany({
      where: { clientId: user.id },
      include: { _count: { select: { applications: true } }, client: true },
      orderBy: { createdAt: "desc" },
    });
    const applications = await prisma.application.findMany({
      where: { job: { clientId: user.id } },
      include: { talent: true, job: true },
      orderBy: { createdAt: "desc" },
      take: 12,
    });

    return (
      <div className="mx-auto max-w-6xl px-5 py-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-copper">Client desk</p>
            <h1 className="font-display mt-2 text-4xl">{user.companyName}</h1>
            <p className="mt-2 text-muted">
              {user.companySize} · {user.companyIndustry}
              {user.paymentConnected ? " · Payment connected" : " · Connect payment to hire smoothly"}
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/billing" className="rounded-full border border-ink/20 px-4 py-2 text-sm">
              Payment
            </Link>
            <Link
              href="/jobs/new"
              className="workora-cta rounded-full bg-[#0db64b] px-4 py-2 text-sm font-semibold transition hover:bg-[#0aa542]"
            >
              Post a job
            </Link>
          </div>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {jobs.length === 0 ? (
            <p className="text-muted">No jobs yet. Post your first brief.</p>
          ) : (
            jobs.map((job) => <JobCard key={job.id} job={job} />)
          )}
        </div>
        <h2 className="font-display mt-14 text-3xl">Incoming proposals</h2>
        <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-cream">
          {applications.length === 0 ? (
            <p className="p-6 text-sm text-muted">Proposals will land here.</p>
          ) : (
            <ul className="divide-y divide-line">
              {applications.map((app) => (
                <li key={app.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div>
                    <p className="flex items-center gap-2 font-medium">
                      <ProfileAvatar name={app.talent?.name || "Talent"} src={app.talent?.avatarUrl} size={28} badge={app.talent?.talentBadge} />
                      {app.talent?.name || "Talent"}
                      {app.talent?.talentBadge ? <TalentBadge compact /> : null}
                    </p>
                    <p className="text-sm text-muted">
                      {app.job?.title || "Job"} · {app.status} · {formatDate(app.createdAt)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/profile/${app.talent?.id}`} className="rounded-full border border-line px-3 py-1 text-xs">
                      Profile
                    </Link>
                    <form action={updateApplicationStatus.bind(null, app.id, "SHORTLISTED")}>
                      <SubmitButton className="!px-3 !py-1 text-xs">Shortlist</SubmitButton>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <h2 className="mt-14 text-2xl font-bold">All open jobs</h2>
        <p className="mt-1 text-sm text-muted">Every signed-in account can browse the full job board.</p>
        <div className="mt-4 grid gap-3">
          {marketplaceJobs.length === 0 ? (
            <p className="text-muted">No open jobs yet.</p>
          ) : (
            marketplaceJobs.map((job) => <JobCard key={job.id} job={job} />)
          )}
        </div>
      </div>
    );
  }

  const ready = talentReady(user);
  const applications = await prisma.application.findMany({
    where: { talentId: user.id },
    include: { job: { include: { client: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-pine">Talent desk</p>
          <h1 className="font-display mt-2 flex flex-wrap items-center gap-3 text-4xl">
            <ProfileAvatar name={user.name} src={user.avatarUrl} size={56} badge={user.talentBadge} />
            {user.name}
            {user.talentBadge ? <TalentBadge /> : null}
          </h1>
          <p className="mt-2 text-muted">
            {user.connects} connects · {ready.ok ? "Ready to apply" : ready.reason}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href={`/profile/${user.id}`} className="rounded-full border border-ink/20 px-4 py-2 text-sm">
            Your profile
          </Link>
          <Link href="/connects" className="rounded-full border border-ink/20 px-4 py-2 text-sm">
            Buy connects
          </Link>
          <Link
            href="/jobs"
            className="workora-cta rounded-full bg-[#0db64b] px-4 py-2 text-sm font-semibold transition hover:bg-[#0aa542]"
          >
            Find work
          </Link>
        </div>
      </div>
      {!user.skillTestPassed ? (
        <div className="mt-8 rounded-2xl border border-line bg-cream p-5">
          <h2 className="font-display text-2xl">Skill test is optional</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Your profile is enough to apply to most jobs. Take the camera-proctored test when you want a
            Talent badge for high-badge roles.
          </p>
          <Link
            href="/skill-test"
            className="mt-4 inline-flex rounded-full bg-[#0db64b] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0aa542]"
          >
            Take the skill test
          </Link>
        </div>
      ) : null}
      <h2 className="font-display mt-12 text-3xl">Your proposals</h2>
      <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-cream">
        {applications.length === 0 ? (
          <p className="p-6 text-sm text-muted">You have not spent connects on a job yet.</p>
        ) : (
          <ul className="divide-y divide-line">
            {applications.map((app) => (
              <li key={app.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <Link href={`/jobs/${app.job?.id}`} className="font-medium hover:underline">
                    {app.job?.title || "Job"}
                  </Link>
                  <p className="text-sm text-muted">
                    {app.job?.client?.companyName || "Client"} · {app.status} · {app.connectsUsed} connects
                  </p>
                </div>
                {app.status === "HIRED" && app.job?.clientId ? (
                  <form action={startConversation.bind(null, app.job.clientId)}>
                    <button className="text-sm underline decoration-copper/40">Message client</button>
                  </form>
                ) : (
                  <span className="text-xs text-muted">Messaging unlocks after hire</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
      <h2 className="mt-12 text-2xl font-bold">Open jobs</h2>
      <p className="mt-1 text-sm text-muted">Browse every live posting on Wova.</p>
      <div className="mt-4 grid gap-3">
        {marketplaceJobs.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>
    </div>
  );
}
