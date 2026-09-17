import Link from "next/link";
import { HighBadge } from "./badges";
import { formatDate, formatMoney } from "@/lib/utils";
import { jobDurationFromTitle, jobTypeFromTitle, parseSkills } from "@/lib/constants";

export type JobCardJob = {
  id: string;
  title: string;
  description: string;
  category: string;
  skills: string;
  budgetMin: number | null;
  budgetMax: number | null;
  budgetType?: string;
  jobType?: string;
  duration?: string;
  highBadge: boolean;
  connectCost: number;
  createdAt: Date;
  status?: string;
  client?: { name: string; companyName: string | null; companyLocation?: string | null } | null;
  _count?: { applications: number };
};

export function JobCard({ job, compact = false }: { job: JobCardJob; compact?: boolean }) {
  const skills = parseSkills(job.skills);
  const hourly = job.budgetType === "hourly";
  const budget =
    job.budgetMin && job.budgetMax
      ? `${formatMoney(job.budgetMin * 100)} – ${formatMoney(job.budgetMax * 100)}${hourly ? " / hr" : ""}`
      : "Budget on request";
  const jobType = job.jobType || jobTypeFromTitle(job.title);
  const duration = job.duration || jobDurationFromTitle(job.title);

  if (compact) {
    return (
      <Link
        href={`/jobs/${job.id}`}
        className="group grid min-h-[94px] grid-cols-[minmax(0,1fr)_20px] items-center gap-3 border-b border-line px-3 py-[12px] last:border-b-0 hover:bg-paper-2/70 sm:px-[16px]"
      >
        <div className="min-w-0">
          <h3 className="truncate text-[14px] font-semibold leading-tight text-ink group-hover:text-[#15803d]">
            {job.title}
          </h3>
          <p className="mt-1 text-[12px] font-semibold text-ink">{budget}</p>
          <p className="mt-0.5 text-[10px] font-medium text-[#16b64a]">{jobType}</p>
          <p className="mt-0.5 text-[9px] text-muted">{duration}</p>
          <p className="mt-0.5 text-[9px] text-muted">{formatDate(job.createdAt)}</p>
          <div className="mt-1.5 flex min-w-0 items-center gap-1.5 overflow-hidden">
            {skills.slice(0, 3).map((skill) => (
              <span key={skill} className="shrink-0 rounded-full bg-paper-2 px-2 py-[2px] text-[9px] leading-none text-muted">
                {skill}
              </span>
            ))}
          </div>
        </div>

        <span className="text-muted transition group-hover:text-[#16b64a]" aria-hidden="true">
          <BookmarkIcon />
        </span>
      </Link>
    );
  }

  return (
    <Link
      href={`/jobs/${job.id}`}
      className="block rounded-2xl border border-line bg-cream p-4 transition hover:border-brand/40 hover:shadow-[0_8px_30px_-18px_rgba(7,20,15,0.35)]"
    >
      <h3 className="text-[16px] font-semibold leading-snug">{job.title}</h3>
      <p className="mt-1 text-sm font-semibold">{budget}</p>
      <p className="mt-0.5 text-xs font-medium text-brand">{jobType}</p>
      <p className="text-[11px] text-muted">{duration}</p>
      <p className="text-[11px] text-muted">{formatDate(job.createdAt)}</p>
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {skills.slice(0, 4).map((skill) => (
          <span key={skill} className="rounded-full bg-paper-2 px-2.5 py-0.5 text-[11px] text-muted">
            {skill}
          </span>
        ))}
        {job.highBadge ? <HighBadge cost={job.connectCost} /> : <span className="text-[11px] text-muted">{job.connectCost} connects</span>}
      </div>
    </Link>
  );
}

function BookmarkIcon() {
  return (
    <svg width="16" height="18" viewBox="0 0 16 18" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3.25 2.25h9.5v13l-4.75-3-4.75 3v-13Z" strokeLinejoin="round" />
    </svg>
  );
}
