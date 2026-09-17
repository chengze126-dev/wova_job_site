import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { updateProfile } from "@/app/actions/auth";
import { ProfileSettingsForm } from "@/components/profile-settings-form";
import { SubmitButton } from "@/components/submit-button";

export default async function ProfileSettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "ADMIN") redirect("/admin");
  if (!user.emailVerified) redirect("/verify-email");
  if (!user.onboardingDone) redirect("/onboarding");

  if (user.role === "CLIENT") {
    return (
      <div className="min-h-screen bg-paper pb-16 text-ink">
        <div className="mx-auto w-[94%] max-w-[720px] space-y-4 pt-5">
          <Link href={`/profile/${user.id}`} className="text-sm font-semibold text-[#14a800]">
            Back to profile
          </Link>
          <section className="rounded-2xl border border-line bg-cream p-5">
            <h1 className="text-[22px] font-semibold">Profile settings</h1>
            <form action={updateProfile} className="mt-5 space-y-4">
              <label className="block text-sm">
                Name
                <input
                  name="name"
                  defaultValue={user.name}
                  className="mt-1 w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink"
                />
              </label>
              <label className="block text-sm">
                Bio
                <textarea
                  name="bio"
                  defaultValue={user.bio || ""}
                  rows={4}
                  className="mt-1 w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink"
                />
              </label>
              <SubmitButton className="!rounded-full !bg-[#14a800]">Save profile</SubmitButton>
            </form>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper pb-16 text-ink">
      <div className="mx-auto w-[94%] max-w-[720px] space-y-4 pt-5">
        <Link href={`/profile/${user.id}`} className="text-sm font-semibold text-[#14a800]">
          Back to profile
        </Link>
        <section className="rounded-2xl border border-line bg-cream p-5">
          <h1 className="text-[22px] font-semibold">Profile settings</h1>
          <ProfileSettingsForm profile={user} />
        </section>
      </div>
    </div>
  );
}
