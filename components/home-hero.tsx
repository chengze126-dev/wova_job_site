import Link from "next/link";
import Image from "next/image";
import type { SessionUser } from "@/lib/auth";
import { TopNav } from "./header";

const popular = ["Remote", "Software Engineer", "Data Analyst", "Product Manager", "UI/UX Designer"];

const features = [
  { title: "Thousands of Jobs", body: "Updated daily", Icon: BriefcaseIcon },
  { title: "Top Companies", body: "Hiring now", Icon: BuildingIcon },
  { title: "Trusted Platform", body: "Secure and reliable", Icon: ShieldIcon },
  { title: "Helpful Resources", body: "Career guidance", Icon: BookIcon },
];

export function HomeHero({ user }: { user: SessionUser | null }) {
  return (
    <>
      <section className="relative min-h-[448px] overflow-hidden rounded-t-[34px] bg-[#000508] text-white max-md:min-h-0 max-md:rounded-none">
        <div className="pointer-events-none absolute inset-x-0 bottom-0 top-0 z-10 mx-auto hidden w-[92%] max-w-[1308px] lg:block">
          <div className="absolute bottom-0 right-0 h-[420px] w-[min(610px,56%)]">
            <div className="absolute inset-0 overflow-hidden">
              <HeroPhoto className="origin-top scale-[1.3]" />
            </div>
            <ActiveJobsCard className="absolute left-[-8px] top-[78px] w-[168px]" />
          </div>
        </div>

        <div className="relative mx-auto w-[92%] max-w-[1308px]">
          <div className="relative z-30">
            <TopNav user={user} onDark />
          </div>

          <div className="relative z-20 pb-0 pt-[18px] lg:pb-8 lg:pt-[27px]">
            <div className="max-w-[738px]">
              <h1 className="text-[34px] font-bold leading-[1.06] tracking-[-0.046em] sm:text-[51px] lg:text-[59px]">
                Great jobs.
                <br />
                <span className="text-[#08b84f]">Better future.</span>
              </h1>

              <p className="mt-[10px] max-w-[430px] text-[14px] leading-[1.5] text-white/85 sm:mt-[13px] sm:text-[16px]">
                Discover opportunities, build your skills
                <br className="hidden sm:block" /> and advance your career.
              </p>

              <form
                action="/jobs"
                className="mt-[16px] flex w-full max-w-[738px] flex-col overflow-hidden rounded-[10px] bg-white p-[5px] shadow-[0_12px_38px_rgba(0,0,0,0.28)] sm:mt-[20px] sm:h-[62px] sm:flex-row sm:items-center"
              >
                <label className="flex min-h-[48px] min-w-0 flex-[1.48] items-center gap-3 px-[13px] text-[#0f172a] sm:min-h-[50px] sm:min-w-[235px] sm:px-[15px]">
                  <SearchIcon />
                  <input
                    name="q"
                    placeholder="Job title, keyword, or company"
                    className="w-full min-w-0 bg-transparent text-[13px] outline-none placeholder:text-[#718096]"
                  />
                </label>

                <span className="hidden h-8 w-px shrink-0 bg-[#e3e8ee] sm:block" />

                <label className="flex min-h-[48px] min-w-0 flex-1 items-center gap-3 px-[13px] text-[#0f172a] sm:min-h-[50px] sm:min-w-[190px] sm:px-[17px]">
                  <PinIcon />
                  <input
                    name="location"
                    placeholder="Location or Remote"
                    className="w-full min-w-0 bg-transparent text-[13px] outline-none placeholder:text-[#718096]"
                  />
                </label>

                <button
                  type="submit"
                  className="h-[48px] w-full shrink-0 rounded-[8px] bg-[#0db64b] px-7 text-[14px] font-semibold text-white transition hover:bg-[#0aa542] sm:h-[52px] sm:w-auto sm:min-w-[150px]"
                >
                  Search Jobs
                </button>
              </form>

              <div className="mt-[14px] flex flex-wrap items-center gap-[8px] pb-5 lg:mt-[17px] lg:gap-[10px] lg:pb-0">
                <span className="mr-1 text-[12px] font-semibold text-white/90">Popular:</span>
                {popular.map((tag) => (
                  <Link
                    key={tag}
                    href={`/jobs?q=${encodeURIComponent(tag)}`}
                    className="rounded-full bg-[#122435] px-[12px] py-[6px] text-[10px] leading-none text-white/90 ring-1 ring-white/[0.06] transition hover:bg-[#193446] lg:px-[14px]"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="relative h-[280px] overflow-hidden lg:hidden">
          <HeroPhoto className="origin-top scale-[1.28]" />
          <ActiveJobsCard className="absolute left-[4%] top-[28px] w-[148px]" />
        </div>
      </section>

      <section id="resources" className="border-b border-line bg-paper">
        <div className="mx-auto grid min-h-[102px] w-[92%] max-w-[1308px] divide-y divide-line sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
          {features.map(({ title, body, Icon }) => (
            <div
              key={title}
              className="flex min-h-[88px] items-center gap-[15px] py-4 sm:min-h-[100px] sm:px-[31px] sm:py-5 sm:first:pl-0 sm:last:pr-0"
            >
              <span className="flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-full bg-brand/10 text-[#12b64d]">
                <Icon />
              </span>
              <div>
                <p className="text-[15px] font-semibold leading-tight text-ink">{title}</p>
                <p className="mt-[5px] text-[12px] text-muted">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function HeroPhoto({ className }: { className: string }) {
  return (
    <div className={`absolute inset-0 ${className}`}>
      <Image
        src="/hero-european-match.png"
        alt="Professional using a MacBook in a chair"
        fill
        priority
        sizes="(max-width: 1024px) 100vw, 610px"
        quality={70}
        className="object-cover object-[64%_10%]"
      />
    </div>
  );
}

function ActiveJobsCard({ className }: { className?: string }) {
  return (
    <div
      className={`rounded-[16px] bg-[#111827] px-[16px] py-[13px] shadow-[0_16px_36px_rgba(0,0,0,0.4)] ${className ?? ""}`}
    >
      <p className="flex items-center gap-2 text-[20px] font-bold tracking-[-0.03em] text-white">
        <span className="h-[8px] w-[8px] rounded-full bg-[#10b981]" />
        8,888
      </p>
      <p className="mt-[3px] text-[13px] text-white">Active Jobs</p>
      <svg className="mt-[10px] h-[20px] w-full" viewBox="0 0 132 20" fill="none" aria-hidden>
        <path
          d="M1 14 C16 14 20 7 32 8 C44 9 48 16 60 12 C72 8 80 4 92 6 C106 8 114 16 131 3"
          stroke="#10b981"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3-3" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
      <path d="M12 21s7-5.2 7-11a7 7 0 1 0-14 0c0 5.8 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.2" />
    </svg>
  );
}

function BriefcaseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

function BuildingIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
      <path d="M4 21V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v16" />
      <path d="M14 9h5a1 1 0 0 1 1 1v11" />
      <path d="M8 8h.01M8 12h.01M8 16h.01M12 8h.01M12 12h.01M12 16h.01" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
      <path d="M12 3 5 6v6c0 4.5 2.8 7.4 7 9 4.2-1.6 7-4.5 7-9V6l-7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
      <path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5Z" />
      <path d="M6 3v16" />
    </svg>
  );
}
