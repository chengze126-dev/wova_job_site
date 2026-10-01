"use client";

import { useEffect, useState } from "react";
import { getLiveSkillMonitors, type LiveSkillMonitor } from "@/app/actions/skill-test";

const STATE_LABEL: Record<LiveSkillMonitor["cameraState"], string> = {
  live: "Camera live",
  off: "Camera off",
  lost: "Signal lost",
  starting: "Starting…",
};

export function AdminLiveSkillMonitor() {
  const [sessions, setSessions] = useState<LiveSkillMonitor[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const result = await getLiveSkillMonitors({ frames: true });
      if (cancelled) return;
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setError(null);
      setSessions(result);
    }

    void load();
    const timer = setInterval(() => {
      void load();
    }, 2000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  return (
    <section className="mt-10">
      <h2 className="font-display text-3xl">Live skill tests</h2>
      <p className="mt-1 text-sm text-muted">
        Camera state and a live snapshot refresh every two seconds while a developer is testing.
      </p>
      {error ? <p className="mt-3 text-sm text-copper-dark">{error}</p> : null}
      {sessions.length === 0 ? (
        <p className="mt-3 rounded-2xl border border-dashed border-line bg-cream p-4 text-sm text-muted">
          No developers are taking a skill test right now.
        </p>
      ) : (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {sessions.map((session) => (
            <article key={session.id} className="overflow-hidden rounded-2xl border border-line bg-cream">
              <div className="relative aspect-video bg-ink">
                {session.frame ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={session.frame} alt={`Live camera for ${session.talentName}`} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-cream/70">
                    {session.cameraState === "starting" ? "Waiting for camera…" : "No live frame"}
                  </div>
                )}
                <span
                  className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                    session.cameraLive ? "bg-[#0db64b] text-white" : "bg-copper-dark text-white"
                  }`}
                >
                  {STATE_LABEL[session.cameraState]}
                </span>
              </div>
              <div className="p-4">
                <p className="font-semibold text-ink">{session.talentName}</p>
                <p className="text-xs text-muted">{session.talentEmail}</p>
                <p className="mt-2 text-sm text-muted">
                  {session.stackName} · question {Math.min(session.questionIndex + 1, session.questionCount)} of{" "}
                  {session.questionCount}
                </p>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
