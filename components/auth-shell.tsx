"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";

export function AuthShell({
  children,
  action,
  eyebrow,
  title,
  subtitle,
  center = false,
  compact = false,
}: {
  children: ReactNode;
  action?: { href: string; label: string };
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  center?: boolean;
  compact?: boolean;
}) {
  return (
    <div data-auth className="grid h-svh overflow-hidden bg-paper-2 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,1fr)]">
      <aside className="relative hidden overflow-hidden bg-[#000508] text-white lg:flex lg:flex-col">
        <video
          className="absolute inset-0 h-full w-full object-cover"
          src="/workora-intro.mp4"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        />
        <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(0,5,8,0.82)_0%,rgba(0,5,8,0.42)_48%,rgba(0,5,8,0.55)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_20%,rgba(8,184,79,0.22),transparent_42%)]" />

        <div className="relative z-10 flex h-full flex-col px-12 py-10">
          <Logo light />
          <div className="my-auto max-w-[440px]">
            <p className="text-[12px] font-semibold uppercase tracking-[0.22em] text-[#08b84f]">
              {eyebrow ?? "Wova"}
            </p>
            <h2 className="mt-4 text-[46px] font-bold leading-[1.04] tracking-[-0.05em]">
              Great jobs.
              <br />
              <span className="text-[#08b84f]">Better future.</span>
            </h2>
            <p className="mt-5 text-[15px] leading-7 text-white/78">
              {subtitle ?? "Discover opportunities, hire verified talent, and grow your career on one platform."}
            </p>
            <div className="mt-9 grid grid-cols-3 gap-3">
              <Stat value="24k+" label="Active jobs" />
              <Stat value="Verified" label="Talent badge" />
              <Stat value="Free" label="To post a job" />
            </div>
          </div>
        </div>
      </aside>

      <section className="relative flex min-h-0 flex-col overflow-hidden bg-paper">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_80%_0%,rgba(13,182,75,0.06),transparent_42%)]" />
        <header className={`relative z-10 flex shrink-0 items-center justify-between px-5 sm:px-10 ${compact ? "h-[56px]" : "h-[64px]"}`}>
          <span className="lg:hidden">
            <Logo />
          </span>
          <span className="hidden text-[12px] font-medium tracking-[0.04em] text-muted lg:inline">
            {title ?? "Account"}
          </span>
          <span className="flex items-center gap-2">
            <ThemeToggle />
            {action ? (
              <Link
                href={action.href}
                className="rounded-full border border-line bg-cream px-[18px] py-[8px] text-[13px] font-semibold text-ink transition hover:border-[#0db64b]/40 hover:text-[#0aa542]"
              >
                {action.label}
              </Link>
            ) : (
              <span />
            )}
          </span>
        </header>

        <div
          className={`relative z-10 flex min-h-0 flex-1 justify-center overflow-hidden px-5 sm:px-10 ${
            center || compact ? "items-center py-3" : "items-center py-4"
          }`}
        >
          <div
            className={`w-full max-w-[440px] rounded-[20px] border border-line bg-cream/92 shadow-[0_24px_60px_rgba(15,40,28,0.07)] backdrop-blur-sm ${
              compact ? "px-6 py-5 sm:px-7 sm:py-6" : "px-7 py-8 sm:px-9 sm:py-9"
            }`}
          >
            {children}
          </div>
        </div>

        <p className="relative z-10 shrink-0 pb-4 text-center text-[11px] tracking-[0.02em] text-muted">
          Secure accounts · Verified talent · Pay when work is done
        </p>
      </section>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-[12px] border border-white/10 bg-white/8 px-3 py-3 backdrop-blur-sm">
      <p className="text-[16px] font-semibold text-white">{value}</p>
      <p className="mt-0.5 text-[11px] text-white/60">{label}</p>
    </div>
  );
}

export function AuthField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block text-[13px] font-semibold text-ink">
      {label}
      <div className="mt-1">{children}</div>
    </label>
  );
}

export const authInputClass =
  "w-full rounded-[10px] border border-line bg-paper px-3.5 py-[9px] text-[14px] text-ink outline-none transition placeholder:text-muted focus:border-[#0db64b] focus:shadow-[0_0_0_3px_rgba(13,182,75,0.12)]";

export function AuthError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="rounded-[8px] bg-[#fef2f2] px-3 py-2 text-[13px] text-[#b42318]" role="alert">
      {message}
    </p>
  );
}

export function AuthSubmit({ children }: { children: ReactNode }) {
  return <AuthSubmitInner>{children}</AuthSubmitInner>;
}

function AuthSubmitInner({ children }: { children: ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-[10px] bg-[#0db64b] py-[11px] text-[14px] font-semibold text-white shadow-[0_8px_20px_rgba(13,182,75,0.22)] transition hover:bg-[#0aa542] disabled:opacity-60"
    >
      {pending ? "Working…" : children}
    </button>
  );
}

export function SocialAuthButtons({ onUnavailable }: { onUnavailable: (provider: string) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <button
        type="button"
        onClick={() => onUnavailable("Google")}
        className="flex h-[40px] items-center justify-center gap-2 rounded-[10px] border border-line bg-cream text-[13px] font-medium text-ink transition hover:border-[#b7cfc2] hover:bg-paper-2"
      >
        <GoogleIcon />
        Google
      </button>
      <button
        type="button"
        onClick={() => onUnavailable("Apple")}
        className="flex h-[40px] items-center justify-center gap-2 rounded-[10px] border border-line bg-cream text-[13px] font-medium text-ink transition hover:border-[#b7cfc2] hover:bg-paper-2"
      >
        <AppleIcon />
        Apple
      </button>
    </div>
  );
}

export function AuthDivider() {
  return (
    <div className="flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.12em] text-muted">
      <span className="h-px flex-1 bg-line" />
      or email
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden>
      <path fill="#4285F4" d="M17.6 9.2c0-.6-.1-1.2-.2-1.8H9v3.4h4.8c-.2 1.1-.9 2.1-1.9 2.7v2.2h3c1.8-1.6 2.7-4 2.7-6.5z" />
      <path fill="#34A853" d="M9 18c2.4 0 4.5-.8 6-2.2l-3-2.2c-.8.6-1.9.9-3 .9-2.3 0-4.3-1.6-5-3.7H1v2.3C2.4 16.1 5.5 18 9 18z" />
      <path fill="#FBBC05" d="M4 10.8c-.2-.6-.3-1.2-.3-1.8s.1-1.2.3-1.8V4.9H1C.4 6.2 0 7.6 0 9s.4 2.8 1 4.1l3-2.3z" />
      <path fill="#EA4335" d="M9 3.6c1.3 0 2.5.5 3.4 1.3l2.6-2.6C13.5.8 11.4 0 9 0 5.5 0 2.4 1.9 1 4.9l3 2.3C4.7 5.1 6.7 3.6 9 3.6z" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="14" height="16" viewBox="0 0 16 18" fill="currentColor" aria-hidden>
      <path d="M13.2 9.5c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.2-2.8.9-3.5.9s-1.8-1-3-.9C3.6 4.3 2 5.2 1.2 6.9c-1.7 3-.4 7.4 1.2 9.8.8 1.2 1.8 2.5 3 2.4 1.2 0 1.6-.8 3.1-.8s1.8.8 3 .8 2.1-1.2 2.9-2.4c.9-1.3 1.3-2.6 1.3-2.7-.1 0-2.5-1-2.5-3.5zM10.8 3.2c.6-.8 1.1-1.9.9-3-1 .1-2.1.7-2.8 1.5-.6.7-1.2 1.8-1 2.9 1.1.1 2.2-.5 2.9-1.4z" />
    </svg>
  );
}
