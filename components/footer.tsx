"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const AUTH_PATHS = new Set(["/login", "/signup", "/forgot-password"]);

const columns = [
  {
    title: "For Clients",
    links: [
      { href: "/#how-it-works", label: "How to hire" },
      { href: "/talents", label: "Talent Marketplace" },
      { href: "/jobs/new", label: "Post a job" },
      { href: "/signup?role=CLIENT", label: "Enterprise hiring" },
      { href: "/talents", label: "Hire worldwide" },
    ],
  },
  {
    title: "For Talent",
    links: [
      { href: "/signup?role=TALENT", label: "Create a profile" },
      { href: "/jobs", label: "Find freelance jobs" },
      { href: "/skill-test", label: "Optional skill test" },
      { href: "/connects", label: "Buy connects" },
      { href: "/#how-it-works", label: "How to find work" },
    ],
  },
  {
    title: "Resources",
    links: [
      { href: "/#resources", label: "Help & support" },
      { href: "/#stories", label: "Success stories" },
      { href: "/#why-workora", label: "Why Wova" },
      { href: "/#categories", label: "Browse categories" },
      { href: "/jobs", label: "Career guidance" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About us" },
      { href: "/#resources", label: "Contact us" },
      { href: "/#why-workora", label: "Trust, safety & security" },
      { href: "/signup", label: "Careers" },
      { href: "/admin", label: "Press" },
    ],
  },
];

export function Footer() {
  const pathname = usePathname();
  if (AUTH_PATHS.has(pathname)) return null;

  return (
    <footer className="bg-footer text-footer-fg">
      <div className="mx-auto w-[92%] max-w-[1308px] px-0 pb-10 pt-[48px]">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {columns.map((column) => (
            <div key={column.title}>
              <p className="text-[15px] font-semibold">{column.title}</p>
              <ul className="mt-[14px] space-y-[10px]">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-[13px] text-footer-fg/70 transition hover:text-footer-fg">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-[42px] flex flex-col gap-3 border-t border-line pt-[18px] text-[12px] text-footer-fg/55 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Wova</p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <Link href="/" className="hover:text-footer-fg">Terms of Service</Link>
            <Link href="/" className="hover:text-footer-fg">Privacy Policy</Link>
            <Link href="/" className="hover:text-footer-fg">Accessibility</Link>
            <Link href="/" className="hover:text-footer-fg">Sitemap</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
