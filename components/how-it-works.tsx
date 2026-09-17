"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type Audience = "hiring" | "talent";

type Step =
  | { kind: "intro"; caption: string }
  | { kind: "video"; caption: string; src: string; label: string }
  | { kind: "image"; caption: string; src: string; alt: string; position?: string };

const hiringSteps: Step[] = [
  { kind: "intro", caption: "Posting jobs is always free" },
  {
    kind: "video",
    caption: "Get proposals and hire",
    src: "/developers-discussing.mp4?v=team",
    label: "several developers discussing proposals",
  },
  {
    kind: "image",
    caption: "Pay when work is done",
    src: "/how-pay.jpg",
    alt: "Laptop with code on a desk, ready for completed work",
    position: "object-[50%_58%]",
  },
];

const talentSteps: Step[] = [
  {
    kind: "video",
    caption: "Create a profile for free",
    src: "/talent-profile.mp4",
    label: "talent creating a Wova profile",
  },
  {
    kind: "video",
    caption: "Search jobs and apply",
    src: "/talent-apply.mp4",
    label: "talent searching jobs and applying",
  },
  {
    kind: "image",
    caption: "Get paid when work is done",
    src: "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1400&q=80",
    alt: "Handshake after a completed contract",
  },
];

export function HowItWorks() {
  const [audience, setAudience] = useState<Audience>("hiring");
  const steps = audience === "hiring" ? hiringSteps : talentSteps;

  return (
    <section id="how-it-works" className="mx-auto w-[92%] max-w-[1308px] pb-[56px] pt-[12px]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-[26px] font-bold tracking-[-0.035em] text-ink sm:text-[32px]">How it works</h2>

        <div className="inline-flex items-center self-start rounded-full bg-paper-2 p-[4px] sm:self-auto">
          <ToggleButton active={audience === "hiring"} onClick={() => setAudience("hiring")}>
            For hiring
          </ToggleButton>
          <ToggleButton active={audience === "talent"} onClick={() => setAudience("talent")}>
            For finding work
          </ToggleButton>
        </div>
      </div>

      <div className="mt-[28px] grid gap-x-[24px] gap-y-[18px] md:grid-cols-3">
        {steps.map((step) => (
          <article key={`${audience}-${step.caption}`}>
            {step.kind === "intro" ? <WovaIntro /> : null}
            {step.kind === "video" ? <AutoVideo src={step.src} label={step.label} /> : null}
            {step.kind === "image" ? (
              <div className="relative aspect-video overflow-hidden rounded-[12px] bg-paper-2">
                <Image
                  src={step.src}
                  alt={step.alt}
                  width={1400}
                  height={788}
                  sizes="(max-width: 768px) 92vw, 420px"
                  quality={90}
                  className={`absolute inset-0 h-full w-full object-cover ${step.position ?? "object-center"}`}
                  style={{ color: "transparent", filter: "blur(0px)" }}
                  suppressHydrationWarning
                />
              </div>
            ) : null}
            <p className="mt-[12px] text-[16px] font-normal leading-snug text-ink sm:text-[17px]">{step.caption}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function ToggleButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-[18px] py-[8px] text-[13px] font-medium transition-all duration-300 sm:px-[20px] sm:text-[14px] ${
        active
          ? "bg-cream text-pine shadow-[0_2px_10px_rgba(15,107,56,0.1)]"
          : "bg-transparent text-muted"
      }`}
    >
      {children}
    </button>
  );
}

function WovaIntro() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = true;
    const play = () => {
      void video.play().catch(() => undefined);
    };
    play();
    video.addEventListener("canplay", play);
    return () => video.removeEventListener("canplay", play);
  }, []);

  async function toggle() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      await video.play();
      setPlaying(true);
    } else {
      video.pause();
      setPlaying(false);
    }
  }

  return (
    <div className="relative aspect-video overflow-hidden rounded-[12px] bg-[#000508]">
      <video
        ref={videoRef}
        className="h-full w-full object-cover"
        src="/workora-intro.mp4"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,5,8,0.62)_0%,rgba(0,5,8,0.18)_48%,rgba(0,5,8,0.06)_100%)]" />

      <div className="absolute inset-y-0 left-0 z-[1] flex w-[48%] flex-col items-center justify-center px-3 text-center">
        <div className="relative">
          <span className="workora-intro-glow absolute -inset-3 rounded-full bg-[#08b84f]/50 blur-md" />
          <Image
            src="/logo-icon.png"
            alt=""
            width={52}
            height={52}
            className="relative h-[44px] w-[44px] object-contain sm:h-[52px] sm:w-[52px]"
            style={{ color: "transparent", filter: "blur(0px)" }}
            suppressHydrationWarning
          />
        </div>
        <p className="mt-[8px] text-[20px] font-bold tracking-[-0.04em] text-white sm:text-[24px]">Wova</p>
        <p className="mt-[4px] text-[11px] text-white/85 sm:text-[12px]">Great jobs. Better future.</p>
      </div>

      <PauseControl playing={playing} onClick={toggle} label="Wova introduction" />
    </div>
  );
}

function AutoVideo({ src, label }: { src: string; label: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = true;
    setPlaying(true);
    const play = () => {
      void video.play().catch(() => undefined);
    };
    play();
    video.addEventListener("canplay", play);
    return () => video.removeEventListener("canplay", play);
  }, [src]);

  async function toggle() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      await video.play();
      setPlaying(true);
    } else {
      video.pause();
      setPlaying(false);
    }
  }

  return (
    <div className="relative aspect-video overflow-hidden rounded-[12px] bg-[#0b1220]">
      <video
        ref={videoRef}
        className="h-full w-full object-cover"
        src={src}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      />
      <PauseControl playing={playing} onClick={toggle} label={label} />
    </div>
  );
}

function PauseControl({
  playing,
  onClick,
  label,
}: {
  playing: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute bottom-[12px] right-[12px] flex h-[36px] w-[36px] items-center justify-center rounded-full bg-white text-[#0f172a] shadow-[0_6px_16px_rgba(0,0,0,0.18)]"
      aria-label={playing ? `Pause ${label}` : `Play ${label}`}
    >
      {playing ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <rect x="6" y="5" width="4.5" height="14" rx="1" />
          <rect x="13.5" y="5" width="4.5" height="14" rx="1" />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden className="ml-[1px]">
          <path d="M8 5.5v13l12-6.5-12-6.5z" />
        </svg>
      )}
    </button>
  );
}
