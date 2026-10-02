"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronDown, Menu, X } from "lucide-react";
import { logoutUser } from "@/app/actions/auth";
import type { SessionUser } from "@/lib/auth";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";
import { AdminMonitorLink } from "./admin-skill-alert";

const AUTH_PATHS = new Set(["/", "/login", "/signup", "/forgot-password", "/reset-password", "/verify-email"]);

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

  const navLinks = user
    ? [
        { href: "/jobs", label: "Jobs" },
        { href: "/companies", label: "Companies" },
      ]
    : [];
  const postHref = user?.role === "CLIENT" ? "/jobs/new" : user ? "/jobs" : "/signup?role=CLIENT";
  const postLabel = user?.role === "CLIENT" ? "Post a Job" : user ? "Browse jobs" : "Post a Job";

  return (
    <div>
      <div className="flex h-[58px] items-center lg:h-[66px]">
        <Logo light={onDark} />

        <nav className={`ml-8 hidden items-center gap-8 text-[13px] font-medium md:ml-[52px] md:flex lg:ml-[92px] lg:gap-[52px] ${onDark ? "text-white/95" : ""}`}>
          {navLinks.map((link) => (
            <Link key={link.label} href={link.href} className={linkClass}>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className={`ml-auto hidden items-center gap-3 text-[13px] font-medium md:flex lg:gap-5 ${onDark ? "text-white/95" : ""}`}>
          <ThemeToggle onDark={onDark} />
          {user?.role === "CLIENT" || user?.role === "ADMIN" ? (
            <Link
              href="/talents"
              className="rounded-[7px] border border-line px-[14px] py-[9px] font-semibold text-header-fg transition hover:border-[#0db64b] hover:text-[#0db64b]"
            >
              Search Talent
            </Link>
          ) : null}
          {user ? (
            <>
              <AccountMenu user={user} onDark={onDark} linkClass={linkClass} />
              <Link
                href={postHref}
                className="rounded-[7px] bg-[#0db64b] px-[19px] py-[11px] font-semibold text-white transition hover:bg-[#0aa542]"
              >
                {postLabel}
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" className={ghostBtn}>
                Sign in
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
            {user?.role === "CLIENT" || user?.role === "ADMIN" ? (
              <Link
                href="/talents"
                onClick={() => setOpen(false)}
                className={`rounded-[8px] px-2 py-2.5 font-semibold ${onDark ? "text-white/95 hover:bg-white/6" : "text-header-fg hover:bg-paper-2"}`}
              >
                Search Talent
              </Link>
            ) : null}
          </nav>

          <div className={`mt-3 flex flex-col gap-1 border-t pt-3 ${onDark ? "border-white/10" : "border-line"}`}>
            {user ? (
              <>
                {accountItems(user).map((item) =>
                  item.href ? (
                    item.admin ? (
                      <AdminMonitorLink
                        key={item.label}
                        href={item.href}
                        className={`rounded-[8px] px-2 py-2.5 ${onDark ? "text-white/95" : "text-header-fg"}`}
                      >
                        {item.label}
                      </AdminMonitorLink>
                    ) : (
                      <Link
                        key={item.label}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={`rounded-[8px] px-2 py-2.5 ${onDark ? "text-white/95" : "text-header-fg"}`}
                      >
                        {item.label}
                      </Link>
                    )
                  ) : null,
                )}
                <form action={logoutUser}>
                  <button className={`w-full rounded-[8px] px-2 py-2.5 text-left ${onDark ? "text-white/95" : "text-header-fg"}`}>
                    Sign out
                  </button>
                </form>
                <Link
                  href={postHref}
                  onClick={() => setOpen(false)}
                  className="mt-2 rounded-[8px] bg-[#0db64b] px-3 py-3 text-center text-[14px] font-semibold text-white"
                >
                  {postLabel}
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className={`rounded-[8px] border px-3 py-2.5 text-center ${onDark ? "border-white/25 text-white/95" : "border-line text-header-fg"}`}
                >
                  Sign in
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
          </div>
        </div>
      ) : null}
    </div>
  );
}

function accountItems(user: SessionUser) {
  const items: { label: string; href?: string; admin?: boolean }[] = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Messages", href: "/messages" },
  ];
  if (user.role === "TALENT") items.push({ label: "Skill test", href: "/skill-test" });
  if (user.role !== "ADMIN") items.push({ label: "Profile", href: `/profile/${user.id}` });
  if (user.role === "ADMIN") items.push({ label: "Monitor", href: "/admin", admin: true });
  return items;
}

function AccountMenu({
  user,
  onDark,
  linkClass,
}: {
  user: SessionUser;
  onDark: boolean;
  linkClass: string;
}) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const first = user.name.split(" ")[0] || "Account";

  useEffect(() => {
    function onDoc(event: MouseEvent) {
      if (!box.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const itemClass = onDark
    ? "block w-full rounded-[8px] px-3 py-2 text-left text-[13px] text-white/95 hover:bg-white/8"
    : "block w-full rounded-[8px] px-3 py-2 text-left text-[13px] text-header-fg hover:bg-paper-2";

  return (
    <div className="relative" ref={box}>
      <button
        type="button"
        className={`inline-flex items-center gap-1 font-medium ${linkClass}`}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
      >
        {first}
        <ChevronDown size={14} className={`transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open ? (
        <div
          role="menu"
          className={`absolute right-0 z-50 mt-2 w-[200px] rounded-[12px] border p-1.5 shadow-lg ${
            onDark ? "border-white/15 bg-[#0b0f0d]" : "border-line bg-cream"
          }`}
        >
          {accountItems(user).map((item) =>
            item.href ? (
              item.admin ? (
                <AdminMonitorLink key={item.label} href={item.href} className={itemClass}>
                  {item.label}
                </AdminMonitorLink>
              ) : (
                <Link key={item.label} href={item.href} role="menuitem" className={itemClass} onClick={() => setOpen(false)}>
                  {item.label}
                </Link>
              )
            ) : null,
          )}
          <form action={logoutUser} className="border-t border-line pt-1">
            <button type="submit" className={itemClass}>
              Sign out
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
