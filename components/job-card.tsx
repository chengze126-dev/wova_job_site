import Link from "next/link";
import { HighBadge } from "./badges";
import { formatDate, formatMoney } from "@/lib/utils";
import { parseSkills } from "@/lib/constants";

export type JobCardJob = {
  id: string;
  title: string;
  description: string;
  category: string;
  skills: string;
  budgetMin: number | null;
  budgetMax: number | null;
  budgetType?: string;
  highBadge: boolean;
  connectCost: number;
  createdAt: Date;
  status?: string;
  client?: { name: string; companyName: string | null; companyLocation?: string | null } | null;
  _count?: { applications: number };
};

export function JobCard({ job, compact = false }: { job: JobCardJob; compact?: boolean }) {
  const skills = parseSkills(job.skills);
  const company = job.client?.companyName || job.client?.name || "Company";
  const mark = company.slice(0, 1).toUpperCase();
  const hourly = job.budgetType === "hourly";
  const budget =
    job.budgetMin && job.budgetMax
      ? `${formatMoney(job.budgetMin * 100)} – ${formatMoney(job.budgetMax * 100)}${hourly ? " / hr" : ""}`
      : "Budget on request";
  const highBudget = Math.max(job.budgetMin ?? 0, job.budgetMax ?? 0) > 3000;
  const budgetLabel =
    job.status === "HIRED" ? "Hired" : job.status === "CLOSED" ? "Closed" : highBudget ? "High-budget" : "Full-time";

  if (compact) {
    return (
      <Link
        href={`/jobs/${job.id}`}
        className="group grid min-h-[94px] grid-cols-[48px_minmax(0,1fr)_20px] items-center gap-3 border-b border-line px-3 py-[12px] last:border-b-0 hover:bg-paper-2/70 sm:grid-cols-[54px_minmax(0,1fr)_auto_24px] sm:gap-[14px] sm:px-[16px]"
      >
        <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[9px] bg-paper-2 text-[17px] font-bold text-pine ring-1 ring-line">
          {mark}
        </div>

        <div className="min-w-0">
          <h3 className="truncate text-[14px] font-semibold leading-tight text-ink group-hover:text-[#15803d]">
            {job.title}
          </h3>
          <p className="mt-1 truncate text-[12px] text-muted">
            {company}
            {job.client?.companyLocation ? ` · ${job.client.companyLocation}` : ""}
          </p>
          <div className="mt-1.5 flex min-w-0 items-center gap-1.5 overflow-hidden">
            {skills.slice(0, 3).map((skill) => (
              <span key={skill} className="shrink-0 rounded-full bg-paper-2 px-2 py-[2px] text-[9px] leading-none text-muted">
                {skill}
              </span>
            ))}
          </div>
        </div>

        <div className="hidden min-w-[132px] text-right sm:block">
          <p className="text-[12px] font-semibold text-ink">{budget}</p>
          <p className="mt-1 text-[10px] font-medium text-[#16b64a]">
            {budgetLabel}
          </p>
          <p className="mt-0.5 text-[9px] text-muted">{formatDate(job.createdAt)}</p>
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
      className="flex gap-4 rounded-2xl border border-line bg-cream p-4 transition hover:border-brand/40 hover:shadow-[0_8px_30px_-18px_rgba(7,20,15,0.35)]"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-paper-2 text-lg font-bold text-pine">
        {mark}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 className="text-[16px] font-semibold leading-snug">{job.title}</h3>
            <p className="mt-0.5 text-sm text-muted">
              {company}
              {job.client?.companyLocation ? ` · ${job.client.companyLocation}` : ""}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold">{budget}</p>
            <p className="mt-0.5 text-xs font-medium text-brand">
              {budgetLabel}
            </p>
            <p className="text-[11px] text-muted">{formatDate(job.createdAt)}</p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {skills.slice(0, 4).map((skill) => (
            <span key={skill} className="rounded-full bg-paper-2 px-2.5 py-0.5 text-[11px] text-muted">
              {skill}
            </span>
          ))}
          {job.highBadge ? <HighBadge cost={job.connectCost} /> : <span className="text-[11px] text-muted">{job.connectCost} connects</span>}
        </div>
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
