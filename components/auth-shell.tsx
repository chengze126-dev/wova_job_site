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
              <Stat value="Live" label="Job marketplace" />
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

export function SocialAuthButtons({
  role,
}: {
  role?: "CLIENT" | "TALENT";
  onUnavailable?: (provider: string) => void;
}) {
  if (role === "CLIENT") return null;
  return (
    <div>
      <div className="grid grid-cols-3 gap-2">
        <a
          href="/api/auth/oauth/google?role=TALENT"
          className="flex h-[40px] items-center justify-center gap-1.5 rounded-[10px] border border-line bg-cream text-[12px] font-medium text-ink transition hover:border-[#b7cfc2] hover:bg-paper-2"
        >
          <GoogleIcon />
          Google
        </a>
        <a
          href="/api/auth/oauth/github?role=TALENT"
          className="flex h-[40px] items-center justify-center gap-1.5 rounded-[10px] border border-line bg-cream text-[12px] font-medium text-ink transition hover:border-[#b7cfc2] hover:bg-paper-2"
        >
          <GitHubIcon />
          GitHub
        </a>
        <a
          href="/api/auth/oauth/linkedin?role=TALENT"
          className="flex h-[40px] items-center justify-center gap-1.5 rounded-[10px] border border-line bg-cream text-[12px] font-medium text-ink transition hover:border-[#b7cfc2] hover:bg-paper-2"
        >
          <LinkedInIcon />
          LinkedIn
        </a>
      </div>
      <p className="mt-2 text-center text-[11px] text-muted">Social login is for talent accounts. Employers use email.</p>
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

function GitHubIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82A7.6 7.6 0 0 1 8 3.5c.68 0 1.36.09 2 .26 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="#0A66C2" aria-hidden>
      <path d="M14.5 0h-13A1.5 1.5 0 0 0 0 1.5v13A1.5 1.5 0 0 0 1.5 16h13a1.5 1.5 0 0 0 1.5-1.5v-13A1.5 1.5 0 0 0 14.5 0zM4.7 13.6H2.4V6h2.3v7.6zM3.6 5A1.3 1.3 0 1 1 3.6 2.4 1.3 1.3 0 0 1 3.6 5zM13.6 13.6h-2.3V9.9c0-.9 0-2-1.2-2s-1.4 1-1.4 2v3.7H6.4V6h2.2v1c.3-.6 1.1-1.2 2.2-1.2 2.4 0 2.8 1.6 2.8 3.6v4.2z" />
    </svg>
  );
}
