"use client";

import { useEffect, useRef, useState } from "react";

export function LazyVideo({
  src,
  className,
  poster,
  label,
}: {
  src: string;
  className?: string;
  poster?: string;
  label?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setReady(true);
      },
      { rootMargin: "180px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const video = ref.current;
    if (!video || !ready) return;
    video.muted = true;
    const play = () => {
      void video.play().catch(() => undefined);
    };
    play();
    video.addEventListener("canplay", play);
    return () => video.removeEventListener("canplay", play);
  }, [ready, src]);

  return (
    <video
      ref={ref}
      className={className}
      src={ready ? src : undefined}
      poster={poster}
      autoPlay={ready}
      muted
      loop
      playsInline
      preload={ready ? "metadata" : "none"}
      aria-label={label}
    />
  );
}
