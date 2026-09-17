import { TalentLogo } from "@/components/badges";
import { initials } from "@/lib/utils";

export function ProfileAvatar({
  name,
  src,
  size = 110,
  badge = false,
}: {
  name: string;
  src?: string | null;
  size?: number;
  badge?: boolean;
  badgeTone?: "light" | "dark";
}) {
  const letters = initials(name) || "W";
  const badgeSize = Math.max(18, Math.round(size * 0.38));
  const ring = badge ? Math.max(3, Math.round(size * 0.055)) : 0;

  return (
    <span className="relative inline-flex shrink-0" style={{ width: size, height: size }}>
      <span
        className={`overflow-hidden rounded-full bg-paper-2 text-center font-semibold text-pine ${
          badge ? "box-border" : ""
        }`}
        style={{
          width: size,
          height: size,
          fontSize: Math.max(14, size * 0.32),
          border: badge ? `${ring}px solid #14a800` : undefined,
        }}
      >
        {src ? (
          // Native img avoids next/image hydration mismatches on this page.
          <img
            src={src}
            alt={name}
            width={size}
            height={size}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center">{letters}</span>
        )}
      </span>
      {badge ? (
        <span className="pointer-events-none absolute -bottom-0.5 -right-0.5">
          <TalentLogo size={badgeSize} />
        </span>
      ) : null}
    </span>
  );
}
