import Link from "next/link";
import { redirect } from "next/navigation";
import { MapPin } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { TalentBadge } from "@/components/badges";
import { ProfileAvatar } from "@/components/profile-avatar";
import { COUNTRIES, parseSkills } from "@/lib/constants";
import { formatHourly } from "@/lib/utils";
import { formatLocation, skillOverlap, textMatchesQuery } from "@/lib/geo";
import { parseExtras } from "@/lib/profile-extras";

export default async function TalentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; name?: string; job?: string; country?: string; skills?: string; badge?: string }>;
}) {
  const params = await searchParams;
  const viewer = await getCurrentUser();
  if (!viewer) redirect("/login?next=/talents");
  if (viewer.role === "TALENT") redirect("/jobs");
  const talents = await prisma.user.findMany({
    where: { role: "TALENT", onboardingDone: true },
    orderBy: [{ talentBadge: "desc" }, { name: "asc" }],
  });
  const clientJobs =
    viewer?.role === "CLIENT"
      ? await prisma.job.findMany({
          where: { clientId: viewer.id, status: "OPEN" },
          orderBy: { createdAt: "desc" },
        })
      : [];
  const selectedJob = clientJobs.find((job) => job.id === params.job);
  const jobSkills = selectedJob ? parseSkills(selectedJob.skills || "") : [];
  const nameQuery = (params.name || params.q || "").trim();
  const countryQuery = (params.country || "").trim();
  const skillQuery = parseSkills(params.skills || "");
  const badgeQuery = (params.badge || "").trim();

  const filtered = talents
    .map((talent) => {
      const extras = parseExtras(talent.extras);
      const skills = parseSkills(talent.skills || "");
      const matches = skillOverlap(jobSkills, skills);
      const skillHits = skillOverlap(skillQuery, skills);
      return { talent, extras, skills, matches, skillHits };
    })
    .filter((item) =>
      nameQuery
        ? textMatchesQuery(`${item.talent.name} ${item.talent.title || ""}`, nameQuery)
        : true,
    )
    .filter((item) => (countryQuery ? item.talent.country === countryQuery : true))
    .filter((item) => (skillQuery.length ? item.skillHits.length > 0 : true))
    .filter((item) => {
      if (badgeQuery === "tested") return Boolean(item.talent.talentBadge || item.talent.skillTestPassed);
      if (badgeQuery === "untested") return !item.talent.talentBadge && !item.talent.skillTestPassed;
      return true;
    })
    .filter((item) => (jobSkills.length ? item.matches.length > 0 : true))
    .sort((a, b) => b.matches.length - a.matches.length || b.skillHits.length - a.skillHits.length);

  const fieldClass = "w-full rounded-xl border border-line bg-paper px-3 py-2.5 text-sm outline-none";

  return (
    <div className="bg-paper-2 pb-16 pt-10">
      <div className="mx-auto w-[92%] max-w-[1080px]">
        <h1 className="text-[32px] font-semibold tracking-[-0.03em] text-ink">Talent</h1>
        <p className="mt-2 text-muted">
          Browse developer profiles. Search by name, country, skills, or skill-tested status, then send a direct
          message. Talent can reply after a contract starts.
        </p>

        <form className="mt-6 grid gap-3 rounded-[12px] border border-line bg-cream p-4 sm:grid-cols-2 lg:grid-cols-4">
          <input name="name" defaultValue={nameQuery} placeholder="Search by name" className={fieldClass} />
          <select name="country" defaultValue={countryQuery} className={fieldClass} aria-label="Country">
            <option value="">All countries</option>
            {COUNTRIES.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
          <input
            name="skills"
            defaultValue={params.skills || ""}
            placeholder="Skills (React, Python…)"
            className={fieldClass}
          />
          <select name="badge" defaultValue={badgeQuery} className={fieldClass} aria-label="Skill tested">
            <option value="">All skill-test states</option>
            <option value="tested">Skill tested</option>
            <option value="untested">Not skill tested</option>
          </select>
          {clientJobs.length ? (
            <select name="job" defaultValue={params.job || ""} className={`${fieldClass} sm:col-span-2`}>
              <option value="">All open jobs</option>
              {clientJobs.map((job) => (
                <option key={job.id} value={job.id}>
                  Match: {job.title}
                </option>
              ))}
            </select>
          ) : null}
          <button className="rounded-xl bg-[#0db64b] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0aa542] sm:col-span-2 lg:col-span-4">
            Search
          </button>
        </form>
        {selectedJob ? (
          <p className="mt-3 text-sm text-muted">
            Showing talent whose skills overlap with <span className="font-semibold text-ink">{selectedJob.title}</span>
            {jobSkills.length ? ` (${jobSkills.slice(0, 6).join(", ")})` : ""}.
          </p>
        ) : null}

        <div className="mt-6 space-y-3">
          {filtered.length === 0 ? <p className="text-muted">No talent matches that search.</p> : null}
          {filtered.map(({ talent, extras, skills, matches }) => {
            return (
              <Link
                key={talent.id}
                href={`/profile/${talent.id}`}
                className="flex gap-4 rounded-[12px] border border-line bg-cream p-5 hover:border-[#14a800]"
              >
                <ProfileAvatar name={talent.name} src={talent.avatarUrl} size={72} badge={talent.talentBadge} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="flex flex-wrap items-center gap-2 text-lg font-semibold text-ink">
                        {talent.name}
                        {talent.talentBadge ? <TalentBadge compact /> : null}
                      </h2>
                      <p className="mt-0.5 flex items-center gap-1 text-sm text-muted">
                        <MapPin size={13} />
                        {formatLocation(extras.city, talent.country) || talent.country || "Remote"}
                      </p>
                    </div>
                    <p className="text-lg font-semibold text-ink">{formatHourly(talent.hourlyRate)}</p>
                  </div>
                  <p className="mt-2 text-[15px] text-ink">{talent.title || "Freelance talent"}</p>
                  {matches.length ? (
                    <p className="mt-1 text-xs font-semibold text-[#14a800]">
                      {matches.length} skill{matches.length === 1 ? "" : "s"} match this job
                    </p>
                  ) : null}
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">
                    {talent.bio || "Talent on Wova."}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {skills.slice(0, 6).map((skill) => (
                      <span
                        key={skill}
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          matches.some((item) => item.toLowerCase() === skill.toLowerCase())
                            ? "bg-[#14a800]/10 text-[#14a800]"
                            : "bg-paper-2 text-pine"
                        }`}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
