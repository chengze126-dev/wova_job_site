export function TalentLogo({
  size = 28,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex shrink-0 overflow-hidden rounded-full ${className}`}
      style={{ width: size, height: size }}
      title="Passed the skill test"
    >
      <img
        src="/talent-badge.png?v=seal"
        alt="Talent badge"
        width={size}
        height={size}
        className="h-full w-full object-cover"
      />
    </span>
  );
}

export function TalentBadge({ compact = false }: { compact?: boolean }) {
  const logoSize = compact ? 16 : 20;
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium text-pine ${
        compact ? "text-[11px]" : "text-xs"
      }`}
      title="Passed the camera-proctored skill test"
    >
      <TalentLogo size={logoSize} />
      Talent badge
    </span>
  );
}

export function HighBadge({ cost }: { cost: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-2.5 py-0.5 text-[11px] font-medium text-pine">
      High-badge · {cost} connects
    </span>
  );
}
