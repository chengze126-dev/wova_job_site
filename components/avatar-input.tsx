"use client";

import { useEffect, useState } from "react";
import { ProfileAvatar } from "./profile-avatar";

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
  const [preview, setPreview] = useState<string | null>(currentSrc || null);

  useEffect(() => {
    return () => {
      if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  return (
    <label className="block text-sm">
      Profile photo {required ? <span className="text-copper-dark">*</span> : null}
      <span className="mt-2 flex items-center gap-4">
        <ProfileAvatar name={personName} src={preview} size={88} />
        <span className="text-sm text-muted">
          A clear photo of you is required. JPG, PNG, or WEBP, under 5MB.
        </span>
      </span>
      <input
        name={name}
        type="file"
        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
        required={required && !currentSrc}
        className="mt-3 w-full text-sm"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
          setPreview(file ? URL.createObjectURL(file) : currentSrc || null);
        }}
      />
    </label>
  );
}
