import Image from "next/image";
import Link from "next/link";

const companies = [
  {
    name: "Northfield Studio",
    industry: "Design & Creative",
    location: "San Francisco, CA",
    image: "/companies/northfield-studio.jpg",
    intro:
      "A product studio in San Francisco. They hire specialists for brand, product, and growth sprints.",
  },
  {
    name: "LumenOps",
    industry: "Software & IT",
    location: "Seattle, WA",
    image: "/companies/lumenops-office.jpg",
    intro: "Operations software for mid-market teams. Based in Seattle and hiring on Wova.",
  },
  {
    name: "Kindling Health",
    industry: "Healthcare",
    location: "Denver, CO",
    image: "/companies/kindling-health.jpg",
    intro: "Clinic software for independent practices. They build calm tools for nurses and patients.",
  },
  {
    name: "Oak & Pine",
    industry: "E-commerce",
    location: "Portland, OR",
    image: "/companies/oak-and-pine.jpg",
    intro: "Direct-to-consumer home goods from Portland. A small team that ships product and packaging work.",
  },
  {
    name: "Harbor Ledger",
    industry: "Finance",
    location: "Austin, TX",
    image: "/companies/harbor-ledger.jpg",
    intro: "Bookkeeping software for independent firms. Quiet, precise product work out of Austin.",
  },
  {
    name: "Brightline Media",
    industry: "Marketing",
    location: "Brooklyn, NY",
    image: "/companies/brightline-media.jpg",
    intro: "A B2B content studio in Brooklyn. They hire writers, editors, and video talent for client stories.",
  },
];

export default function CompaniesPage() {
  return (
    <div className="bg-paper pb-20 text-ink">
      <section className="border-b border-line bg-paper-2">
        <div className="mx-auto w-[92%] max-w-[1080px] py-14 sm:py-16">
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#0db64b]">Marketplace</p>
          <h1 className="mt-3 max-w-3xl text-[36px] font-bold tracking-[-0.04em] sm:text-[44px]">Companies</h1>
          <p className="mt-4 max-w-2xl text-[16px] leading-7 text-muted">
            A few of the teams hiring on Wova. Each one posts real work for talent to apply to.
          </p>
        </div>
      </section>

      <section className="mx-auto w-[92%] max-w-[1080px] pt-12">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {companies.map((company) => (
            <article key={company.name} className="flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-cream">
              <div className="relative h-[200px] overflow-hidden bg-paper-2 sm:h-[220px]">
                <Image
                  src={company.image}
                  alt={`${company.name} workplace`}
                  fill
                  sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 340px"
                  className="object-cover"
                />
              </div>
              <div className="flex flex-1 flex-col p-5">
                <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#0db64b]">{company.industry}</p>
                <h2 className="mt-1 text-[20px] font-semibold tracking-[-0.03em]">{company.name}</h2>
                <p className="mt-1 text-sm text-ink/70">{company.location}</p>
                <p className="mt-3 text-sm leading-6 text-muted">{company.intro}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-10">
          <Link href="/jobs" className="rounded-full bg-[#0db64b] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0aa542]">
            See open jobs
          </Link>
        </div>
      </section>
    </div>
  );
}
