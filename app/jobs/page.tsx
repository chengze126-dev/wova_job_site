import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { JobCard } from "@/components/job-card";
import { JOB_CATEGORIES } from "@/lib/constants";
import Link from "next/link";

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string; location?: string; view?: string }>;
}) {
  const params = await searchParams;
  const user = await getCurrentUser();
  const history = params.view === "history";
  const jobs = await prisma.job.findMany({
    where: {
      status: history ? { in: ["HIRED", "CLOSED"] } : "OPEN",
      ...(params.category ? { category: params.category } : {}),
      ...(params.q
        ? {
            OR: [
              { title: { contains: params.q } },
              { description: { contains: params.q } },
            ],
          }
        : {}),
    },
    include: { client: true, _count: { select: { applications: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="bg-paper-2/60">
      <div className="mx-auto max-w-6xl px-5 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">{history ? "Job history" : "Open jobs"}</h1>
            <p className="mt-1 text-sm text-muted">
              {history
                ? `${jobs.length} completed or closed roles on Wova`
                : `${jobs.length} roles on Wova`}
            </p>
          </div>
          <form className="flex w-full max-w-md overflow-hidden rounded-xl border border-line bg-cream sm:w-auto">
            {history ? <input type="hidden" name="view" value="history" /> : null}
            <input
              name="q"
              defaultValue={params.q}
              placeholder="Job title, keyword, or company."
              className="w-full px-4 py-2.5 text-sm outline-none"
            />
            <button className="bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-copper-dark">
              Search
            </button>
          </form>
        </div>
        <div className="mt-5 inline-flex rounded-full bg-paper-2 p-1">
          <Link
            href={params.q ? `/jobs?q=${encodeURIComponent(params.q)}` : "/jobs"}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold ${history ? "text-muted" : "bg-cream text-ink shadow-sm"}`}
          >
            Open jobs
          </Link>
          <Link
            href={params.q ? `/jobs?view=history&q=${encodeURIComponent(params.q)}` : "/jobs?view=history"}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold ${history ? "bg-cream text-ink shadow-sm" : "text-muted"}`}
          >
            Job history
          </Link>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <a
            href={history ? "/jobs?view=history" : "/jobs"}
            className={`rounded-full px-3 py-1 text-xs font-medium ${!params.category ? "bg-ink text-paper" : "bg-cream text-muted"}`}
          >
            All
          </a>
          {JOB_CATEGORIES.map((category) => (
            <a
              key={category}
              href={`/jobs?${new URLSearchParams({
                ...(history ? { view: "history" } : {}),
                category,
                ...(params.q ? { q: params.q } : {}),
              }).toString()}`}
              className={`rounded-full px-3 py-1 text-xs font-medium ${params.category === category ? "bg-ink text-paper" : "bg-cream text-muted"}`}
            >
              {category}
            </a>
          ))}
        </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_280px]">
          <div className="grid gap-3">
            {jobs.length === 0 ? <p className="text-muted">No jobs match that filter.</p> : null}
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
          <aside className="h-fit rounded-2xl border border-line bg-cream p-6">
            {user?.role === "TALENT" ? (
              <>
                <p className="font-semibold">Apply like on Upwork</p>
                <p className="mt-2 text-sm text-muted">
                  Open a job, write a proposal, and spend connects to submit. Clients review and hire.
                </p>
                <p className="mt-5 text-sm text-muted">You have {user.connects} connects.</p>
              </>
            ) : (
              <>
                <p className="font-semibold">Hiring on Wova?</p>
                <p className="mt-2 text-sm text-muted">Post a role. Talent apply with proposals and connects.</p>
                <Link
                  href={user?.role === "CLIENT" ? "/jobs/new" : "/signup?role=CLIENT"}
                  className="workora-cta mt-5 block rounded-full bg-[#0db64b] px-4 py-2.5 text-center text-sm font-semibold transition hover:bg-[#0aa542]"
                >
                  Post a job
                </Link>
              </>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
