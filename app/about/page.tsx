import Image from "next/image";
import Link from "next/link";

const leaders = [
  {
    name: "Dieudonne Awa",
    role: "Chief Executive Officer",
    title: "CEO",
    image: "/about/ceo-office.jpg",
    alt: "Dieudonne Awa, CEO of Wova",
    bio: "Leads Wova’s product and company direction so clients and talent can hire, work, and get paid in one place.",
  },
  {
    name: "Tim Demars",
    role: "Chief Technology Officer",
    title: "CTO",
    image: "/about/cto-office.jpg",
    alt: "Tim Demars, CTO of Wova",
    bio: "Builds the marketplace, skill tests, and trust systems that keep hiring on Wova fast and fair.",
  },
];

export default function AboutPage() {
  return (
    <div className="bg-paper pb-20 text-ink">
      <section className="border-b border-line bg-paper-2">
        <div className="mx-auto w-[92%] max-w-[1080px] py-14 sm:py-16">
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#0db64b]">Company</p>
          <h1 className="mt-3 max-w-3xl text-[36px] font-bold tracking-[-0.04em] sm:text-[44px]">About Wova</h1>
          <p className="mt-4 max-w-2xl text-[16px] leading-7 text-muted">
            Wova is a job marketplace for great work and a better future. Clients post roles. Talent builds a
            profile, takes an optional skill test, and earns a badge clients can trust.
          </p>
        </div>
      </section>

      <section className="mx-auto w-[92%] max-w-[1080px] pt-12">
        <h2 className="text-[22px] font-semibold tracking-[-0.03em]">Leadership</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          The people who run Wova. CEO sets the course. CTO builds the product behind hiring, tests, and pay.
        </p>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {leaders.map((person) => (
            <article key={person.name} className="overflow-hidden rounded-2xl border border-line bg-cream">
              <div className="relative h-[340px] overflow-hidden bg-paper-2 sm:h-[420px]">
                <Image
                  src={person.image}
                  alt={person.alt}
                  fill
                  sizes="(max-width: 768px) 92vw, 500px"
                  className="object-cover object-[50%_12%] brightness-[1.02] contrast-[0.98] saturate-[0.92]"
                />
                <div className="pointer-events-none absolute inset-0 bg-[#f4efe6]/12" />
              </div>
              <div className="p-5">
                <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#0db64b]">{person.title}</p>
                <h3 className="mt-1 text-[22px] font-semibold tracking-[-0.03em]">{person.name}</h3>
                <p className="mt-1 text-sm font-medium text-ink/80">{person.role}</p>
                <p className="mt-3 text-sm leading-6 text-muted">{person.bio}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-14 w-[92%] max-w-[1080px] rounded-2xl border border-line bg-cream p-6 sm:p-8">
        <h2 className="text-[22px] font-semibold tracking-[-0.03em]">What we are building</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <div>
            <p className="font-semibold">For talent</p>
            <p className="mt-2 text-sm leading-6 text-muted">
              A profile, optional skill tests across 20 stacks, and a badge for high-trust jobs.
            </p>
          </div>
          <div>
            <p className="font-semibold">For clients</p>
            <p className="mt-2 text-sm leading-6 text-muted">
              Post work, review proposals, and hire people whose skills are already proven.
            </p>
          </div>
          <div>
            <p className="font-semibold">For both</p>
            <p className="mt-2 text-sm leading-6 text-muted">
              Clear pay, messages in one place, and a marketplace that stays simple.
            </p>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/signup?role=TALENT" className="rounded-full bg-[#0db64b] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0aa542]">
            Create a profile
          </Link>
          <Link href="/jobs" className="rounded-full border border-line px-5 py-2.5 text-sm font-semibold text-ink hover:border-[#0db64b]/40">
            Browse jobs
          </Link>
        </div>
      </section>
    </div>
  );
}
