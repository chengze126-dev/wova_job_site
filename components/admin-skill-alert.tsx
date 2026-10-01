"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { getLiveSkillMonitors, type LiveSkillMonitor } from "@/app/actions/skill-test";

export const SKILL_LIVE_EVENT = "wova-skill-live";

function playAlertTone() {
  try {
    const AudioCtx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    for (const [offset, freq] of [
      [0, 880],
      [0.14, 1174],
    ] as const) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.12, now + offset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.16);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + offset);
      osc.stop(now + offset + 0.18);
    }
  } catch {
    // Autoplay may be blocked until the admin interacts with the page.
  }
}

function notifyDesktop(session: LiveSkillMonitor) {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  try {
    new Notification("Skill test started", {
      body: `${session.talentName} is taking ${session.stackName}. Camera must stay on.`,
      tag: session.id,
    });
  } catch {
    // Ignore missing notification support.
  }
}

export function AdminSkillAlert() {
  const pathname = usePathname();
  const [toast, setToast] = useState<LiveSkillMonitor | null>(null);
  const [live, setLive] = useState<LiveSkillMonitor[]>([]);
  const knownRef = useRef<Set<string> | null>(null);
  const titleRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function tick() {
      const result = await getLiveSkillMonitors({ frames: false });
      if (cancelled || "error" in result) return;

      const ids = new Set(result.map((session) => session.id));
      setLive(result);
      window.dispatchEvent(new CustomEvent(SKILL_LIVE_EVENT, { detail: { count: result.length } }));

      if (knownRef.current == null) {
        knownRef.current = ids;
        return;
      }

      const newcomers = result.filter((session) => !knownRef.current!.has(session.id));
      knownRef.current = ids;
      if (newcomers.length === 0) return;

      const newest = newcomers[0];
      setToast(newest);
      playAlertTone();
      notifyDesktop(newest);
      if (titleRef.current == null) titleRef.current = document.title;
      document.title = `Skill test · ${newest.talentName}`;
    }

    void tick();
    const timer = setInterval(() => {
      void tick();
    }, 2500);
    return () => {
      cancelled = true;
      clearInterval(timer);
      if (titleRef.current) document.title = titleRef.current;
    };
  }, []);

  useEffect(() => {
    if (typeof Notification === "undefined") return;
    if (Notification.permission === "default") {
      void Notification.requestPermission();
    }
  }, []);

  function dismissToast() {
    setToast(null);
    if (titleRef.current) document.title = titleRef.current;
  }

  const banner = toast ?? (live[0] ?? null);
  const underHeader = pathname !== "/" && !pathname.startsWith("/login") && !pathname.startsWith("/signup");

  if (!banner && live.length === 0) return null;

  return (
    <div
      className={`pointer-events-none fixed inset-x-0 z-[70] flex justify-center px-4 ${
        underHeader ? "top-[66px] md:top-[74px]" : "top-4"
      }`}
    >
      <div
        role="alert"
        aria-live="assertive"
        className="pointer-events-auto flex w-full max-w-xl items-start gap-3 rounded-2xl border border-[#0db64b]/40 bg-cream px-4 py-3 shadow-[0_12px_40px_rgba(15,23,42,0.16)]"
      >
        <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[#0db64b] shadow-[0_0_0_4px_rgba(13,182,75,0.22)]" />
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-ink">
            {toast ? "Skill test started" : live.length > 1 ? `${live.length} live skill tests` : "Live skill test"}
          </p>
          <p className="mt-0.5 truncate text-[12px] text-muted">
            {banner.talentName} · {banner.stackName}
            {live.length > 1 && toast ? ` · +${live.length - 1} more` : ""}
          </p>
        </div>
        <Link
          href="/admin"
          className="shrink-0 rounded-full bg-[#0db64b] px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-[#0aa542]"
          onClick={dismissToast}
        >
          Watch live
        </Link>
        {toast ? (
          <button
            type="button"
            onClick={dismissToast}
            className="shrink-0 rounded-full px-2 py-1.5 text-[12px] text-muted hover:text-ink"
          >
            Dismiss
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function AdminMonitorLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    function onLive(event: Event) {
      const detail = (event as CustomEvent<{ count?: number }>).detail;
      setCount(Number(detail?.count || 0));
    }
    window.addEventListener(SKILL_LIVE_EVENT, onLive);
    return () => window.removeEventListener(SKILL_LIVE_EVENT, onLive);
  }, []);

  return (
    <Link href={href} className={`relative inline-flex items-center ${className ?? ""}`}>
      {children}
      {count > 0 ? (
        <span className="ml-1.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#0db64b] px-1 text-[10px] font-bold leading-none text-white">
          {count}
        </span>
      ) : null}
    </Link>
  );
}
