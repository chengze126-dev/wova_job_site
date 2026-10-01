import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { JobCard } from "@/components/job-card";
import { JOB_CATEGORIES, parseSkills } from "@/lib/constants";
import { skillOverlap, textMatchesQuery } from "@/lib/geo";
import Link from "next/link";

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string; location?: string; view?: string; match?: string }>;
}) {
  const params = await searchParams;
  const user = await getCurrentUser();
  const history = params.view === "history";
  const matchSkills = params.match !== "0" && user?.role === "TALENT";
  const profileSkills = user?.role === "TALENT" ? parseSkills(user.skills || "") : [];
  const jobs = await prisma.job.findMany({
    where: {
      status: history ? { in: ["HIRED", "CLOSED"] } : "OPEN",
      ...(params.category ? { category: params.category } : {}),
    },
    include: { client: true, _count: { select: { applications: true } } },
    orderBy: { createdAt: "desc" },
  });

  const queried = params.q?.trim() || "";
  const filtered = jobs
    .map((job) => {
      const skills = parseSkills(job.skills || "");
      const matches = skillOverlap(profileSkills, skills);
      const haystack = `${job.title} ${job.description} ${skills.join(" ")} ${job.client?.companyName || ""} ${job.client?.name || ""}`;
      return { job, matches, haystack };
    })
    .filter((item) => (queried ? textMatchesQuery(item.haystack, queried) : true))
    .filter((item) => (matchSkills && profileSkills.length ? item.matches.length > 0 : true))
    .sort((a, b) => (matchSkills ? b.matches.length - a.matches.length : 0));

  return (
    <div className="bg-paper-2/60">
      <div className="mx-auto max-w-6xl px-5 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">{history ? "Job history" : "Open jobs"}</h1>
            <p className="mt-1 text-sm text-muted">
              {matchSkills && profileSkills.length
                ? `${filtered.length} roles matching your skills`
                : history
                  ? `${filtered.length} completed or closed roles on Wova`
                  : `${filtered.length} roles on Wova`}
            </p>
          </div>
          <form className="flex w-full max-w-md overflow-hidden rounded-xl border border-line bg-cream sm:w-auto">
            {history ? <input type="hidden" name="view" value="history" /> : null}
            {params.match === "0" ? <input type="hidden" name="match" value="0" /> : null}
            {params.category ? <input type="hidden" name="category" value={params.category} /> : null}
            <input
              name="q"
              defaultValue={params.q}
              placeholder="Job title, skill, or company."
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
        {user?.role === "TALENT" && profileSkills.length ? (
          <div className="mt-4">
            {params.match === "0" ? (
              <Link
                href={`/jobs?${new URLSearchParams({
                  ...(history ? { view: "history" } : {}),
                  ...(params.q ? { q: params.q } : {}),
                  ...(params.category ? { category: params.category } : {}),
                }).toString()}`}
                className="text-sm font-semibold text-[#14a800]"
              >
                Show jobs matching my skills ({profileSkills.slice(0, 4).join(", ")})
              </Link>
            ) : (
              <Link
                href={`/jobs?${new URLSearchParams({
                  ...(history ? { view: "history" } : {}),
                  ...(params.q ? { q: params.q } : {}),
                  ...(params.category ? { category: params.category } : {}),
                  match: "0",
                }).toString()}`}
                className="text-sm font-semibold text-[#14a800]"
              >
                Show all jobs
              </Link>
            )}
          </div>
        ) : null}
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
                ...(params.match === "0" ? { match: "0" } : {}),
              }).toString()}`}
              className={`rounded-full px-3 py-1 text-xs font-medium ${params.category === category ? "bg-ink text-paper" : "bg-cream text-muted"}`}
            >
              {category}
            </a>
          ))}
        </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_280px]">
          <div className="grid gap-3">
            {filtered.length === 0 ? <p className="text-muted">No jobs match that filter.</p> : null}
            {filtered.map(({ job, matches }) => (
              <JobCard key={job.id} job={job} matchCount={matchSkills ? matches.length : undefined} />
            ))}
          </div>
          <aside className="h-fit rounded-2xl border border-line bg-cream p-6">
            {user?.role === "TALENT" ? (
              <>
                <p className="font-semibold">Matched to your skills</p>
                <p className="mt-2 text-sm text-muted">
                  Jobs are ranked by overlap with your profile skills
                  {profileSkills.length ? `: ${profileSkills.slice(0, 6).join(", ")}` : "."}
                </p>
                <p className="mt-5 text-sm text-muted">You have {user.connects} connects.</p>
              </>
            ) : (
              <>
                <p className="font-semibold">Hiring on Wova?</p>
                <p className="mt-2 text-sm text-muted">Post a role, then search talent that matches those skills.</p>
                <Link
                  href={user?.role === "CLIENT" ? "/talents" : "/signup?role=CLIENT"}
                  className="workora-cta mt-5 block rounded-full bg-[#0db64b] px-4 py-2.5 text-center text-sm font-semibold transition hover:bg-[#0aa542]"
                >
                  {user?.role === "CLIENT" ? "Find talent" : "Post a job"}
                </Link>
              </>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
