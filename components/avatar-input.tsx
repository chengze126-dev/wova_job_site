"use client";

import { useEffect, useRef, useState } from "react";
import { ProfileAvatar } from "./profile-avatar";
import { compressImageFile, replaceInputFile } from "@/lib/compress-image-client";

export function AvatarInput({
  name = "avatar",
  required = false,
  currentSrc,
  personName,
}: {
  name?: string;
  required?: boolean;
  currentSrc?: string | null;
  personName: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const pending = useRef<Promise<void> | null>(null);
  const [preview, setPreview] = useState<string | null>(currentSrc || null);
  const [optimizing, setOptimizing] = useState(false);

  useEffect(() => {
    setPreview(currentSrc || null);
  }, [currentSrc]);

  useEffect(() => {
    return () => {
      if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  useEffect(() => {
    const form = inputRef.current?.form;
    if (!form) return;
    const onSubmit = (event: SubmitEvent) => {
      const job = pending.current;
      if (!job) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      const giveUp = new Promise<void>((resolve) => setTimeout(resolve, 4000));
      void Promise.race([job, giveUp]).finally(() => {
        pending.current = null;
        form.requestSubmit();
      });
    };
    form.addEventListener("submit", onSubmit, true);
    return () => form.removeEventListener("submit", onSubmit, true);
  }, []);

  return (
    <label className="block text-sm">
      Profile photo {required ? <span className="text-copper-dark">*</span> : null}
      <span className="mt-2 flex items-center gap-4">
        <ProfileAvatar name={personName} src={preview} size={88} />
        <span className="text-sm text-muted">
          A clear photo of you is required. JPG, PNG, or WEBP, under 5MB. We optimize it before saving.
        </span>
      </span>
      <input
        ref={inputRef}
        name={name}
        type="file"
        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
        required={required && !currentSrc}
        className="mt-3 w-full text-sm"
        onChange={(event) => {
          const input = event.currentTarget;
          const file = input.files?.[0];
          setPreview((current) => {
            if (current?.startsWith("blob:")) URL.revokeObjectURL(current);
            return file ? URL.createObjectURL(file) : currentSrc || null;
          });
          if (!file) return;
          setOptimizing(true);
          const job = compressImageFile(file)
            .then((compressed) => {
              replaceInputFile(input, compressed);
              setPreview((current) => {
                if (current?.startsWith("blob:")) URL.revokeObjectURL(current);
                return URL.createObjectURL(compressed);
              });
            })
            .finally(() => {
              pending.current = null;
              setOptimizing(false);
            });
          pending.current = job;
        }}
      />
      {optimizing ? <span className="mt-1 block text-xs text-muted">Optimizing photo…</span> : null}
    </label>
  );
}
