import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { COMPANY_SIZES, INDUSTRIES } from "@/lib/constants";
import { completeClientOnboarding } from "@/app/actions/auth";
import { SubmitButton } from "@/components/submit-button";
import { PhoneInput } from "@/components/phone-input";
import { LocationInput } from "@/components/location-input";
import { TalentOnboardingForm } from "@/components/talent-onboarding-form";

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.emailVerified) redirect("/verify-email");
  if (user.role === "ADMIN") redirect("/admin");
  if (user.onboardingDone && user.role === "CLIENT") redirect("/dashboard");
  if (user.onboardingDone && user.role === "TALENT") redirect(`/profile/${user.id}`);
  if (user.onboardingDone) redirect("/dashboard");

  if (user.role === "TALENT") {
    return (
      <div className="mx-auto max-w-xl px-5 py-14">
        <p className="text-xs uppercase tracking-[0.24em] text-pine">Talent setup</p>
        <h1 className="font-display mt-2 text-4xl">Build your profile</h1>
        <p className="mt-3 text-muted">
          Add a photo, title, rate, and skills so clients can find you. The skill test is optional after
          your profile is live.
        </p>
        <TalentOnboardingForm
          name={user.name}
          avatarUrl={user.avatarUrl}
          linkedinUrl={user.linkedinUrl}
          country={user.country}
          phone={user.phone}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-5 py-14">
      <p className="text-xs uppercase tracking-[0.24em] text-copper">Client setup</p>
      <h1 className="font-display mt-2 text-4xl">Tell us about the company</h1>
      <p className="mt-3 text-muted">Clients add a company name, size, industry, and how to reach them.</p>
      <form action={completeClientOnboarding} className="mt-8 space-y-4 rounded-2xl border border-line bg-cream p-6">
        <label className="block text-sm">
          Company name
          <input name="companyName" required className="mt-1 w-full rounded-xl border border-line bg-paper px-3 py-2" />
        </label>
        <label className="block text-sm">
          Company size
          <select name="companySize" required className="mt-1 w-full rounded-xl border border-line bg-paper px-3 py-2">
            <option value="">Select size</option>
            {COMPANY_SIZES.map((size) => (
              <option key={size.value} value={size.value}>
                {size.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          Industry
          <select name="companyIndustry" required className="mt-1 w-full rounded-xl border border-line bg-paper px-3 py-2">
            <option value="">Select industry</option>
            {INDUSTRIES.map((industry) => (
              <option key={industry} value={industry}>
                {industry}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          Website
          <input name="companyWebsite" placeholder="https://" className="mt-1 w-full rounded-xl border border-line bg-paper px-3 py-2" />
        </label>
        <LocationInput
          combinedName="companyLocation"
          defaultCountry={user.country}
          label="Company location"
        />
        <PhoneInput defaultCountry={user.country} defaultPhone={user.phone} required />
        <label className="block text-sm">
          What you hire for
          <textarea name="bio" rows={4} className="mt-1 w-full rounded-xl border border-line bg-paper px-3 py-2" />
        </label>
        <SubmitButton>Save company profile</SubmitButton>
      </form>
    </div>
  );
}
