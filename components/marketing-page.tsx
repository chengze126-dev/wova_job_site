import Link from "next/link";
import type { ReactNode } from "react";

export type PageCta = { href: string; label: string; primary?: boolean };
export type PageCard = { title: string; body: string; href?: string };

export function PageShell({ children }: { children: ReactNode }) {
  return <div className="bg-paper pb-20 text-ink">{children}</div>;
}

export function PageHero({
  eyebrow,
  title,
  lede,
  ctas,
}: {
  eyebrow: string;
  title: string;
  lede: string;
  ctas?: PageCta[];
}) {
  return (
    <section className="border-b border-line bg-paper-2">
      <div className="mx-auto w-[92%] max-w-[1080px] py-14 sm:py-16">
        <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#0db64b]">{eyebrow}</p>
        <h1 className="mt-3 max-w-3xl text-[36px] font-bold tracking-[-0.04em] sm:text-[44px]">{title}</h1>
        <p className="mt-4 max-w-2xl text-[16px] leading-7 text-muted">{lede}</p>
        {ctas?.length ? <PageCtas className="mt-7" items={ctas} /> : null}
      </div>
    </section>
  );
}

export function PageCtas({ items, className }: { items: PageCta[]; className?: string }) {
  return (
    <div className={`flex flex-wrap gap-3 ${className ?? ""}`}>
      {items.map((cta) => (
        <Link
          key={cta.href + cta.label}
          href={cta.href}
          className={
            cta.primary === false
              ? "rounded-full border border-line px-5 py-2.5 text-sm font-semibold text-ink hover:border-[#0db64b]/40"
              : "rounded-full bg-[#0db64b] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0aa542]"
          }
        >
          {cta.label}
        </Link>
      ))}
    </div>
  );
}

export function CardGrid({ items }: { items: PageCard[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => {
        const inner = (
          <>
            <p className="text-[16px] font-semibold text-ink">{item.title}</p>
            <p className="mt-2 text-[14px] leading-6 text-muted">{item.body}</p>
          </>
        );
        return item.href ? (
          <Link
            key={item.title}
            href={item.href}
            className="rounded-2xl border border-line bg-cream px-5 py-5 transition hover:border-[#b7e4c7]"
          >
            {inner}
          </Link>
        ) : (
          <div key={item.title} className="rounded-2xl border border-line bg-cream px-5 py-5">
            {inner}
          </div>
        );
      })}
    </div>
  );
}

export function StepList({ items }: { items: PageCard[] }) {
  return (
    <ol className="space-y-4">
      {items.map((item, index) => (
        <li key={item.title} className="flex gap-4 rounded-2xl border border-line bg-cream px-5 py-5">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0db64b]/10 text-[13px] font-bold text-[#0db64b]">
            {index + 1}
          </span>
          <div>
            <p className="text-[16px] font-semibold text-ink">{item.title}</p>
            <p className="mt-1 text-[14px] leading-6 text-muted">{item.body}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function PageSection({
  title,
  lede,
  children,
}: {
  title: string;
  lede?: string;
  children: ReactNode;
}) {
  return (
    <section className="mx-auto w-[92%] max-w-[1080px] pt-12">
      <h2 className="text-[22px] font-semibold tracking-[-0.03em]">{title}</h2>
      {lede ? <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{lede}</p> : null}
      <div className="mt-6">{children}</div>
    </section>
  );
}
