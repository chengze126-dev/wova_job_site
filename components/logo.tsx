import Image from "next/image";
import Link from "next/link";

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className="group flex items-center gap-[10px]" aria-label="Wova home">
      <Image
        src="/logo-icon.png"
        alt=""
        width={40}
        height={40}
        className="h-[38px] w-[38px] object-contain"
        style={{ color: "transparent", filter: "blur(0px)" }}
        priority
        suppressHydrationWarning
      />
      <span className={`text-[23px] font-bold tracking-[-0.035em] ${light ? "text-white" : "text-ink"}`}>
        Wova
      </span>
    </Link>
  );
}
