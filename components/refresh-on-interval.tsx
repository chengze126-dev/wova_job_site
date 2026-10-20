"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function RefreshOnInterval({ seconds }: { seconds: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => router.refresh(), Math.max(1, seconds) * 1000);
    return () => clearInterval(id);
  }, [router, seconds]);
  return null;
}
