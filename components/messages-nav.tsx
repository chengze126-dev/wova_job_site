"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageCircle } from "lucide-react";

export function MessagesNav({
  initialCount = 0,
  onDark = false,
  className = "",
}: {
  initialCount?: number;
  onDark?: boolean;
  className?: string;
}) {
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    setCount(initialCount);
  }, [initialCount]);

  useEffect(() => {
    let stop = false;
    async function tick() {
      try {
        const res = await fetch("/api/presence", { method: "POST", credentials: "include" });
        if (!res.ok) return;
        const data = (await res.json()) as { unread?: number };
        if (!stop && typeof data.unread === "number") setCount(data.unread);
      } catch {
        // ignore network errors
      }
    }
    void tick();
    const id = setInterval(() => void tick(), 20000);
    return () => {
      stop = true;
      clearInterval(id);
    };
  }, []);

  const label = count > 0 ? `Messages, ${count} unread` : "Messages";
  const badge = count > 99 ? "99+" : String(count);

  return (
    <Link
      href="/messages"
      aria-label={label}
      className={`relative inline-flex h-10 w-10 items-center justify-center rounded-[8px] transition ${
        onDark ? "text-white/95 hover:bg-white/8 hover:text-white" : "text-header-fg/90 hover:bg-paper-2 hover:text-header-fg"
      } ${className}`}
    >
      <MessageCircle size={22} strokeWidth={1.8} />
      {count > 0 ? (
        <span className="absolute right-0.5 top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#e31c25] px-1 text-[10px] font-bold leading-none text-white">
          {badge}
        </span>
      ) : null}
    </Link>
  );
}
