"use client";

import { useActionState } from "react";
import { completeTalentOnboarding } from "@/app/actions/auth";
import { SubmitButton } from "@/components/submit-button";
import { AvatarInput } from "@/components/avatar-input";
import { PhoneInput } from "@/components/phone-input";
import { LocationInput } from "@/components/location-input";

export function TalentOnboardingForm({
  name,
  avatarUrl,
  linkedinUrl,
  country,
  phone,
}: {
  name: string;
  avatarUrl?: string | null;
  linkedinUrl?: string | null;
  country?: string | null;
  phone?: string | null;
}) {
  const [state, action] = useActionState(completeTalentOnboarding, null);

  return (
    <form action={action} className="mt-8 space-y-4 rounded-2xl border border-line bg-cream p-6">
      {state?.error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      ) : null}
      <AvatarInput personName={name} currentSrc={avatarUrl} required={!avatarUrl} />
      <LocationInput defaultCity="" defaultCountry={country} required />
      <label className="block text-sm">
        Professional title
        <input
          name="title"
          required
          minLength={4}
          placeholder="Full-Stack Developer"
          className="mt-1 w-full rounded-xl border border-line bg-paper px-3 py-2"
        />
      </label>
      <label className="block text-sm">
        Hourly rate (USD)
        <input
          name="hourlyRate"
          type="number"
          required
          min={5}
          max={500}
          placeholder="45"
          className="mt-1 w-full rounded-xl border border-line bg-paper px-3 py-2"
        />
      </label>
      <label className="block text-sm">
        Skills (comma-separated)
        <input
          name="skills"
          required
          placeholder="React, TypeScript, Node.js"
          className="mt-1 w-full rounded-xl border border-line bg-paper px-3 py-2"
        />
      </label>
      <label className="block text-sm">
        LinkedIn profile URL
        <input
          name="linkedinUrl"
          required={!linkedinUrl}
          defaultValue={linkedinUrl || ""}
          placeholder="https://www.linkedin.com/in/you"
          className="mt-1 w-full rounded-xl border border-line bg-paper px-3 py-2"
        />
      </label>
      <label className="block text-sm">
        GitHub profile URL
        <input
          name="githubUrl"
          defaultValue=""
          placeholder="https://github.com/you"
          className="mt-1 w-full rounded-xl border border-line bg-paper px-3 py-2"
        />
      </label>
      <PhoneInput defaultCountry={country} defaultPhone={phone} required />
      <label className="block text-sm">
        Resume (PDF, DOC, DOCX, or TXT)
        <input name="resume" type="file" accept=".pdf,.doc,.docx,.txt" required className="mt-1 w-full text-sm" />
      </label>
      <label className="block text-sm">
        Overview
        <textarea
          name="bio"
          rows={5}
          placeholder="Tell clients what you do and the work you want."
          className="mt-1 w-full rounded-xl border border-line bg-paper px-3 py-2"
        />
      </label>
      <SubmitButton>Save profile</SubmitButton>
    </form>
  );
}
