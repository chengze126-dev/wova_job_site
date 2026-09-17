import Link from "next/link";

const categories = [
  { name: "Software Development", jobs: "4,820", href: "/jobs?q=Software" },
  { name: "UI / UX Design", jobs: "1,640", href: "/jobs?q=Designer" },
  { name: "Data & Analytics", jobs: "980", href: "/jobs?q=Data" },
  { name: "Product Management", jobs: "720", href: "/jobs?q=Product" },
  { name: "Marketing", jobs: "1,210", href: "/jobs?q=Marketing" },
  { name: "Writing & Content", jobs: "640", href: "/jobs?q=Writer" },
];

const reasons = [
  { title: "Verified talent", body: "Optional skill tests and a Talent badge so clients can hire with confidence." },
  { title: "Fair proposals", body: "Talents apply with connects, so every proposal is a real, considered fit." },
  { title: "Clear pay", body: "Agree the work, then pay when the job is done. No surprise fees to post." },
  { title: "One place to work", body: "Jobs, messaging, and profiles stay on Wova from first search to hire." },
];

const stories = [
  {
    quote: "I hired a verified designer in two days. The skill badge made the shortlist obvious.",
    name: "Jordan Hale",
    role: "Founder, Northfield",
  },
  {
    quote: "The skill test felt serious. After I passed, clients started answering my proposals.",
    name: "Maya Chen",
    role: "Product designer",
  },
  {
    quote: "We staffed a billing audit without a long agency process. Wova kept it simple.",
    name: "Priya Raman",
    role: "Ops lead",
  },
];

export function HomeMore() {
  return (
    <>
      <section id="categories" className="bg-paper-2">
        <div className="mx-auto w-[92%] max-w-[1308px] py-[48px]">
          <h2 className="text-[22px] font-bold tracking-[-0.03em] text-ink sm:text-[26px]">Browse by category</h2>
          <p className="mt-[6px] text-[14px] text-muted">Find work, or talent, in the fields hiring most on Wova.</p>
          <div className="mt-[22px] grid gap-[14px] sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <Link
                key={category.name}
                href={category.href}
                className="rounded-[12px] border border-line bg-cream px-[18px] py-[18px] transition hover:border-[#b7e4c7] hover:shadow-[0_8px_24px_rgba(15,23,42,0.05)]"
              >
                <p className="text-[16px] font-semibold text-ink">{category.name}</p>
                <p className="mt-[4px] text-[13px] text-[#16a34a]">{category.jobs} open roles</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="why-workora" className="mx-auto w-[92%] max-w-[1308px] py-[52px]">
        <h2 className="text-[22px] font-bold tracking-[-0.03em] text-ink sm:text-[26px]">Why Wova</h2>
        <p className="mt-[6px] max-w-[520px] text-[14px] text-muted">
          Built for hiring managers and independent talent — not a generic job board.
        </p>
        <div className="mt-[22px] grid gap-[16px] sm:grid-cols-2 lg:grid-cols-4">
          {reasons.map((reason) => (
            <div key={reason.title} className="rounded-[12px] border border-line bg-cream px-[18px] py-[20px]">
              <p className="text-[16px] font-semibold text-ink">{reason.title}</p>
              <p className="mt-[8px] text-[13px] leading-relaxed text-muted">{reason.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="stories" className="bg-paper-2">
        <div className="mx-auto w-[92%] max-w-[1308px] py-[48px]">
          <h2 className="text-[22px] font-bold tracking-[-0.03em] text-ink sm:text-[26px]">Success stories</h2>
          <div className="mt-[22px] grid gap-[16px] md:grid-cols-3">
            {stories.map((story) => (
              <figure key={story.name} className="rounded-[12px] border border-line bg-cream px-[20px] py-[22px]">
                <blockquote className="text-[14px] leading-relaxed text-ink/80">“{story.quote}”</blockquote>
                <figcaption className="mt-[16px]">
                  <p className="text-[13px] font-semibold text-ink">{story.name}</p>
                  <p className="mt-[2px] text-[12px] text-muted">{story.role}</p>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#000508] text-white">
        <div className="mx-auto grid w-[92%] max-w-[1308px] gap-8 py-[52px] md:grid-cols-2">
          <div>
            <p className="text-[13px] font-semibold text-[#08b84f]">For clients</p>
            <h2 className="mt-[8px] text-[26px] font-bold tracking-[-0.035em]">Hire verified talent</h2>
            <p className="mt-[10px] max-w-[420px] text-[14px] leading-relaxed text-white/70">
              Post a job free, review proposals, and pay when the work is done.
            </p>
            <Link href="/signup?role=CLIENT" className="mt-[20px] inline-flex rounded-[8px] bg-[#0db64b] px-5 py-[12px] text-[14px] font-semibold text-white transition hover:bg-[#0aa542]">
              Post a job
            </Link>
          </div>
          <div>
            <p className="text-[13px] font-semibold text-[#08b84f]">For talent</p>
            <h2 className="mt-[8px] text-[26px] font-bold tracking-[-0.035em]">Find work that fits</h2>
            <p className="mt-[10px] max-w-[420px] text-[14px] leading-relaxed text-white/70">
              Pass the skill test, earn a badge, and apply to jobs with connects.
            </p>
            <Link href="/signup?role=TALENT" className="mt-[20px] inline-flex rounded-[8px] border border-white/25 px-5 py-[12px] text-[14px] font-semibold text-white transition hover:bg-white/8">
              Create a profile
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
