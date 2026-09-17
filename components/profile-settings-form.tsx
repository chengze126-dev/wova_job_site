import type { User } from "@/lib/prisma";
import { parseSkills } from "@/lib/constants";
import { parseExtras } from "@/lib/profile-extras";
import { updateProfileBasics } from "@/app/actions/profile";
import { AvatarInput } from "@/components/avatar-input";
import { SubmitButton } from "@/components/submit-button";

const fieldClass =
  "mt-1 w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-muted";

export function ProfileSettingsForm({ profile }: { profile: User }) {
  const extras = parseExtras(profile.extras);
  const skills = parseSkills(profile.skills || "");

  return (
    <form action={updateProfileBasics} className="mt-5 space-y-4">
      <AvatarInput personName={profile.name} currentSrc={profile.avatarUrl} required={!profile.avatarUrl} />
      <label className="block text-sm">
        Name
        <input name="name" defaultValue={profile.name} className={fieldClass} />
      </label>
      <label className="block text-sm">
        City
        <input name="city" defaultValue={extras.city || ""} className={fieldClass} />
      </label>
      <label className="block text-sm">
        Title
        <input name="title" defaultValue={profile.title || ""} className={fieldClass} />
      </label>
      <label className="block text-sm">
        Hourly rate (USD)
        <input name="hourlyRate" type="number" min={5} max={500} defaultValue={profile.hourlyRate ?? 40} className={fieldClass} />
      </label>
      <label className="block text-sm">
        Hours per week
        <input name="hoursPerWeek" defaultValue={extras.hoursPerWeek} className={fieldClass} />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="availableNow" defaultChecked={extras.availableNow} className="accent-[#14a800]" />
        Open for work
      </label>
      <label className="block text-sm">
        GitHub URL
        <input name="githubUrl" defaultValue={extras.githubUrl || ""} className={fieldClass} />
      </label>
      <label className="block text-sm">
        Skills (comma-separated)
        <input name="skills" defaultValue={skills.join(", ")} className={fieldClass} />
      </label>
      <label className="block text-sm">
        Overview
        <textarea name="bio" rows={8} defaultValue={profile.bio || ""} className={fieldClass} />
      </label>
      <SubmitButton className="!rounded-full !bg-[#14a800]">Save profile</SubmitButton>
    </form>
  );
}
