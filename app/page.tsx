import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { JobCard } from "@/components/job-card";
import { HomeHero } from "@/components/home-hero";
import { HowItWorks } from "@/components/how-it-works";
import { HomeMore } from "@/components/home-more";
import { getSession } from "@/lib/auth";

const referenceBrands = ["Google", "Microsoft", "Amazon", "Stripe", "Notion", "HubSpot"];

export default async function HomePage() {
  const session = await getSession();
  const jobs = await prisma.job.findMany({
    where: { status: "OPEN" },
    include: { client: true, _count: { select: { applications: true } } },
    orderBy: { createdAt: "desc" },
    take: 4,
  });

  return (
    <div className="bg-paper" data-home>
      <HomeHero user={session} />

      <section id="companies" className="mx-auto w-[92%] max-w-[1308px] pb-[22px] pt-[24px]">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[16px] font-bold tracking-[-0.025em] text-ink sm:text-[18px]">Top Companies Hiring</h2>
          <Link href="/companies" className="shrink-0 text-[11px] font-semibold text-[#16a34a] hover:underline">
            <span className="sm:hidden">View all →</span>
            <span className="hidden sm:inline">View all companies →</span>
          </Link>
        </div>

        <div className="mt-[14px] grid grid-cols-2 gap-[20px] sm:grid-cols-3 lg:grid-cols-6">
          {referenceBrands.map((name) => <BrandCard key={name} name={name} />)}
        </div>
      </section>

      <section className="mx-auto w-[92%] max-w-[1308px] pb-[48px] pt-[1px]">
        <h2 className="text-[18px] font-bold tracking-[-0.025em] text-ink">Recommended Jobs</h2>

        <div className="mt-[13px] grid items-stretch gap-[36px] lg:grid-cols-[minmax(0,1fr)_295px]">
          <div className="overflow-hidden rounded-[11px] border border-line bg-cream shadow-[0_8px_24px_rgba(15,23,42,0.025)]">
            {jobs.length > 0 ? jobs.map((job) => <JobCard key={job.id} job={job} compact />) : <EmptyJobs />}
          </div>

          <aside className="flex min-h-[286px] flex-col items-center justify-center rounded-[12px] border border-line bg-cream px-[36px] py-7 text-center shadow-[0_10px_30px_rgba(15,23,42,0.045)]">
            <div className="flex h-[82px] w-[82px] items-center justify-center rounded-full bg-brand/10 text-[#0fb449]">
              <BellIcon />
            </div>
            <p className="mt-[22px] text-[17px] font-semibold leading-tight text-ink">Get job alerts</p>
            <p className="mt-[7px] text-[13px] text-muted">delivered to your inbox</p>
            <Link href="/signup?role=TALENT" className="mt-[31px] block w-full rounded-[7px] bg-[#0db64b] px-4 py-[13px] text-center text-[13px] font-semibold text-white transition hover:bg-[#0aa542]">Create Alert</Link>
          </aside>
        </div>
      </section>

      <HowItWorks />
      <HomeMore />
    </div>
  );
}

function BrandCard({ name }: { name: string }) {
  return (
    <div className="flex h-[66px] items-center justify-center rounded-[9px] border border-line bg-cream px-3 shadow-[0_4px_12px_rgba(15,23,42,0.018)]">
      <BrandMark name={name} />
    </div>
  );
}

function BrandMark({ name }: { name: string }) {
  if (name === "Google") {
    return (
      <span className="text-[19px] font-semibold tracking-[-0.04em]">
        <span className="text-[#4285f4]">G</span><span className="text-[#ea4335]">o</span><span className="text-[#fbbc05]">o</span><span className="text-[#4285f4]">g</span><span className="text-[#34a853]">l</span><span className="text-[#ea4335]">e</span>
      </span>
    );
  }
  if (name === "Microsoft") {
    return (
      <span className="flex items-center gap-2 text-[15px] font-medium text-[#5d6670]">
        <span className="grid h-5 w-5 grid-cols-2 gap-[2px]"><i className="bg-[#f25022]" /><i className="bg-[#7fba00]" /><i className="bg-[#00a4ef]" /><i className="bg-[#ffb900]" /></span>
        Microsoft
      </span>
    );
  }
  if (name === "Amazon") {
    return (
        <span className="relative inline-block pb-[7px] text-[20px] font-bold lowercase leading-none tracking-[-0.04em] text-ink">
        amazon
        <svg className="absolute -bottom-[1px] left-[2px] h-[10px] w-[58px]" viewBox="0 0 70 12" fill="none" aria-hidden>
          <path d="M4 4c12 8 38 10 58-1" stroke="#ff9900" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M56 1.5l7 1.2-3.6 5.6" fill="#ff9900" />
        </svg>
      </span>
    );
  }
  if (name === "Stripe") return <span className="text-[21px] font-bold tracking-[-0.055em] text-[#635bff]">stripe</span>;
  if (name === "Notion") {
    return (
      <span className="flex items-center gap-[6px] text-[15px] font-semibold tracking-[-0.02em] text-ink">
        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
          <path fill="currentColor" d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 2.777c-.42-.326-.98-.7-2.054-.607L3.01 3.295c-.466.046-.56.28-.374.466zm.793 3.126v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.746-.887l-15.177.887c-.56.047-.749.327-.749.933zm14.337.745c.093.42 0 .793-.42.84l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952L12.21 19s0 .793-1.168.793l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.139c-.093-.514.28-.887.747-.933zM1.936 1.035l13.31-.98c1.634-.14 2.055-.047 3.082.7l4.249 2.986c.696.514.928.653.928 1.213v16.378c0 1.026-.373 1.634-1.68 1.726l-15.458.934c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.306-.793-1.96V2.667c0-.839.374-1.54 1.447-1.632z" />
        </svg>
        Notion
      </span>
    );
  }
  if (name === "HubSpot") {
    return (
      <span className="flex items-center text-[16px] font-bold tracking-[-0.03em] text-ink">
        HubSp
        <svg className="-mx-[1px] h-[16px] w-[16px] shrink-0 translate-y-[-1px]" viewBox="0 0 20 20" aria-hidden>
          <circle cx="10" cy="11.4" r="5.05" fill="none" stroke="#ff7a59" strokeWidth="2.15" />
          <path d="M7.15 7.45 5.05 3.7M12.85 7.45 14.95 3.7" stroke="#ff7a59" strokeWidth="1.55" strokeLinecap="round" />
          <circle cx="4.75" cy="3.25" r="1.7" fill="#ff7a59" />
          <circle cx="15.25" cy="3.25" r="1.7" fill="#ff7a59" />
          <circle cx="10" cy="15.85" r="1.7" fill="#ff7a59" />
        </svg>
        t
      </span>
    );
  }
  return <span className="text-[15px] font-semibold text-ink">{name}</span>;
}

function EmptyJobs() {
  return <div className="flex min-h-[252px] items-center justify-center px-6 text-center text-[13px] text-muted">New opportunities will appear here as soon as employers publish them.</div>;
}

function BellIcon() {
  return (
    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 7h18s-3 0-3-7" />
      <path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </svg>
  );
}
