import { isOnline } from "@/lib/presence";

export function OnlineBadge({
  lastSeenAt,
  compact = false,
}: {
  lastSeenAt?: Date | string | null;
  compact?: boolean;
}) {
  const online = isOnline(lastSeenAt);
  const label = online ? "Online" : "Offline";

  if (compact) {
    return (
      <span
        className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${online ? "bg-[#14a800]" : "bg-[#c4c4c4]"}`}
        title={label}
        aria-label={label}
      />
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 text-[13px] font-medium ${online ? "text-[#14a800]" : "text-muted"}`}>
      <span className={`h-2.5 w-2.5 rounded-full ${online ? "bg-[#14a800]" : "bg-[#c4c4c4]"}`} />
      {label}
    </span>
  );
}
