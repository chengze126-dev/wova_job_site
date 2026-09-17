"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";

export function LocalTime({ timeZone }: { timeZone?: string }) {
  const [label, setLabel] = useState("");
  useEffect(() => {
    try {
      const zone = timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone;
      const text = new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "2-digit",
        timeZone: zone,
      }).format(new Date());
      setLabel(`${text} local time`);
    } catch {
      setLabel("");
    }
  }, [timeZone]);
  if (!label) return null;
  return <span>{label}</span>;
}

export function OverviewText({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const long = text.length > 420;
  const shown = !long || open ? text : `${text.slice(0, 420).trim()}...`;
  return (
    <div>
      <p className="whitespace-pre-wrap text-[15px] leading-7 text-ink">{shown}</p>
      {long ? (
        <button type="button" onClick={() => setOpen((value) => !value)} className="mt-2 text-sm font-semibold text-[#14a800]">
          {open ? "less" : "more"}
        </button>
      ) : null}
    </div>
  );
}

export function IconCircle({
  children,
  as = "button",
  ...props
}: {
  children: ReactNode;
  as?: "button" | "span";
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const className =
    "inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#14a800] text-[#14a800] hover:bg-[#14a800]/10";
  if (as === "span") return <span className={className}>{children}</span>;
  return (
    <button type="button" className={className} {...props}>
      {children}
    </button>
  );
}

export function AddPanel({ label, children }: { label: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        type="button"
        aria-label={label}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#14a800] text-[#14a800] hover:bg-[#14a800]/10"
      >
        <Plus size={16} />
      </button>
      {open ? <div className="mt-3">{children}</div> : null}
    </div>
  );
}

export function PencilLink({ href }: { href: string }) {
  return (
    <a
      href={href}
      aria-label="Edit"
      className="inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#14a800] text-[#14a800] hover:bg-[#14a800]/10"
    >
      <Pencil size={14} />
    </a>
  );
}

export function TrashSubmit() {
  return (
    <button
      type="submit"
      aria-label="Remove"
      className="inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#14a800] text-[#14a800] hover:bg-[#14a800]/10"
    >
      <Trash2 size={14} />
    </button>
  );
}

export function WorkTabs({
  completed,
  inProgress,
}: {
  completed: ReactNode;
  inProgress: ReactNode;
}) {
  const [tab, setTab] = useState<"completed" | "progress">("completed");
  return (
    <div>
      <div className="flex gap-6 border-b border-line text-[15px] font-semibold">
        <button
          type="button"
          onClick={() => setTab("completed")}
          className={`border-b-2 pb-2 ${tab === "completed" ? "border-ink text-ink" : "border-transparent text-muted"}`}
        >
          Completed jobs
        </button>
        <button
          type="button"
          onClick={() => setTab("progress")}
          className={`border-b-2 pb-2 ${tab === "progress" ? "border-ink text-ink" : "border-transparent text-muted"}`}
        >
          In progress
        </button>
      </div>
      <div className="pt-5">{tab === "completed" ? completed : inProgress}</div>
    </div>
  );
}
