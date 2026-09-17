"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { logoutUser } from "@/app/actions/auth";
import type { SessionUser } from "@/lib/auth";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";

const navLinks = [
  { href: "/jobs", label: "Jobs" },
  { href: "/companies", label: "Companies" },
  { href: "/#resources", label: "Resources" },
];

const AUTH_PATHS = new Set(["/", "/login", "/signup", "/forgot-password", "/verify-email"]);

export function Header({ user }: { user: SessionUser | null }) {
  const pathname = usePathname();
  if (AUTH_PATHS.has(pathname)) return null;

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-header text-header-fg">
      <div className="mx-auto w-[92%] max-w-[1308px]">
        <TopNav user={user} />
      </div>
    </header>
  );
}

export function TopNav({ user, onDark = false }: { user: SessionUser | null; onDark?: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const linkClass = onDark
    ? "transition hover:text-white/70"
    : "text-header-fg/90 transition hover:text-header-fg";
  const ghostBtn = onDark
    ? "rounded-[7px] border border-white/30 px-[16px] py-[9px] font-semibold text-white transition hover:border-white hover:bg-white/8"
    : "rounded-[7px] border border-line px-[16px] py-[9px] font-semibold text-header-fg transition hover:border-ink";

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const postHref = user?.role === "CLIENT" ? "/jobs/new" : user ? "/jobs" : "/signup?role=CLIENT";
  const postLabel = user?.role === "CLIENT" ? "Post a Job" : user ? "Browse jobs" : "Post a Job";

  return (
    <div>
      <div className="flex h-[58px] items-center lg:h-[66px]">
        <Logo light={onDark} />

        <nav className={`ml-[92px] hidden items-center gap-[52px] text-[13px] font-medium md:flex ${onDark ? "text-white/95" : ""}`}>
          {navLinks.map((link) => (
            <Link key={link.label} href={link.href} className={linkClass}>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className={`ml-auto hidden items-center gap-[22px] text-[13px] font-medium md:flex ${onDark ? "text-white/95" : ""}`}>
          <ThemeToggle onDark={onDark} />
          {user ? (
            <>
              <Link href="/dashboard" className={`hidden sm:inline ${linkClass}`}>
                Dashboard
              </Link>
              {user.role === "TALENT" ? (
                <Link href="/skill-test" className={`hidden sm:inline ${linkClass}`}>
                  Skill test
                </Link>
              ) : null}
              {user.role !== "ADMIN" ? (
                <Link href={`/profile/${user.id}`} className={`hidden sm:inline ${linkClass}`}>
                  Profile
                </Link>
              ) : null}
              {user.role === "ADMIN" ? (
                <Link href="/admin" className={`hidden lg:inline ${linkClass}`}>
                  Monitor
                </Link>
              ) : null}
              <form action={logoutUser}>
                <button className={linkClass}>Sign out</button>
              </form>
              <Link
                href={postHref}
                className="rounded-[7px] bg-[#0db64b] px-[19px] py-[11px] font-semibold text-white transition hover:bg-[#0aa542]"
              >
                {postLabel}
              </Link>
            </>
          ) : (
            <>
              <Link href="/signup?role=CLIENT" className={linkClass}>
                For Employers
              </Link>
              <Link href="/login" className={ghostBtn}>
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-[7px] bg-[#0db64b] px-[19px] py-[11px] font-semibold text-white transition hover:bg-[#0aa542]"
              >
                Sign up
              </Link>
            </>
          )}
        </div>

        <div className="ml-auto flex items-center gap-1 md:hidden">
          <ThemeToggle onDark={onDark} />
          <button
            type="button"
            className={`flex h-10 w-10 items-center justify-center rounded-[8px] ${onDark ? "text-white" : "text-header-fg"}`}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {open ? (
        <div id="mobile-nav" className={`border-t pb-5 pt-3 md:hidden ${onDark ? "border-white/10" : "border-line"}`}>
          <nav className="flex flex-col gap-1 text-[15px] font-medium">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setOpen(false)}
                className={`rounded-[8px] px-2 py-2.5 ${onDark ? "text-white/95 hover:bg-white/6" : "text-header-fg hover:bg-paper-2"}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className={`mt-3 flex flex-col gap-2 border-t pt-3 ${onDark ? "border-white/10" : "border-line"}`}>
            {user ? (
              <>
                <Link href="/dashboard" onClick={() => setOpen(false)} className={`rounded-[8px] px-2 py-2.5 ${onDark ? "text-white/95" : "text-header-fg"}`}>
                  Dashboard
                </Link>
                {user.role === "TALENT" ? (
                  <Link href="/skill-test" onClick={() => setOpen(false)} className={`rounded-[8px] px-2 py-2.5 ${onDark ? "text-white/95" : "text-header-fg"}`}>
                    Skill test
                  </Link>
                ) : null}
                {user.role !== "ADMIN" ? (
                  <Link
                    href={`/profile/${user.id}`}
                    onClick={() => setOpen(false)}
                    className={`rounded-[8px] px-2 py-2.5 ${onDark ? "text-white/95" : "text-header-fg"}`}
                  >
                    Profile
                  </Link>
                ) : null}
                {user.role === "ADMIN" ? (
                  <Link href="/admin" onClick={() => setOpen(false)} className={`rounded-[8px] px-2 py-2.5 ${onDark ? "text-white/95" : "text-header-fg"}`}>
                    Monitor
                  </Link>
                ) : null}
                <form action={logoutUser}>
                  <button className={`w-full rounded-[8px] px-2 py-2.5 text-left ${onDark ? "text-white/95" : "text-header-fg"}`}>Sign out</button>
                </form>
              </>
            ) : (
              <>
                <Link href="/signup?role=CLIENT" onClick={() => setOpen(false)} className={`rounded-[8px] px-2 py-2.5 ${onDark ? "text-white/95" : "text-header-fg"}`}>
                  For Employers
                </Link>
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className={`rounded-[8px] border px-3 py-2.5 text-center ${onDark ? "border-white/25 text-white/95" : "border-line text-header-fg"}`}
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setOpen(false)}
                  className="rounded-[8px] bg-[#0db64b] px-3 py-3 text-center text-[14px] font-semibold text-white"
                >
                  Sign up
                </Link>
              </>
            )}
            {user ? (
              <Link
                href={postHref}
                onClick={() => setOpen(false)}
                className="mt-1 rounded-[8px] bg-[#0db64b] px-3 py-3 text-center text-[14px] font-semibold text-white"
              >
                {postLabel}
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
