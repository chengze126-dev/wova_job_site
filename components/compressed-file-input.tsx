"use client";

import { useEffect, useRef, useState } from "react";
import { compressImageFile, replaceInputFile } from "@/lib/compress-image-client";

export function CompressedFileInput({
  name,
  accept = "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp",
  required = false,
  className = "mt-1 w-full text-sm",
}: {
  name: string;
  accept?: string;
  required?: boolean;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const pending = useRef<Promise<void> | null>(null);
  const [optimizing, setOptimizing] = useState(false);

  useEffect(() => {
    const form = inputRef.current?.form;
    if (!form) return;
    const onSubmit = (event: SubmitEvent) => {
      const job = pending.current;
      if (!job) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      void job.finally(() => {
        pending.current = null;
        form.requestSubmit();
      });
    };
    form.addEventListener("submit", onSubmit, true);
    return () => form.removeEventListener("submit", onSubmit, true);
  }, []);

  return (
    <span className="block">
      <input
        ref={inputRef}
        name={name}
        type="file"
        accept={accept}
        required={required}
        className={className}
        onChange={(event) => {
          const input = event.currentTarget;
          const file = input.files?.[0];
          if (!file) return;
          setOptimizing(true);
          const job = compressImageFile(file)
            .then((compressed) => replaceInputFile(input, compressed))
            .finally(() => {
              pending.current = null;
              setOptimizing(false);
            });
          pending.current = job;
        }}
      />
      {optimizing ? <span className="mt-1 block text-xs text-muted">Optimizing photo…</span> : null}
    </span>
  );
}
