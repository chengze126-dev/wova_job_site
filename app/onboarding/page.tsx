import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { COMPANY_SIZES, INDUSTRIES } from "@/lib/constants";
import { completeClientOnboarding, completeTalentOnboarding } from "@/app/actions/auth";
import { SubmitButton } from "@/components/submit-button";
import { AvatarInput } from "@/components/avatar-input";

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
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
        <form action={completeTalentOnboarding} className="mt-8 space-y-4 rounded-2xl border border-line bg-cream p-6">
          <AvatarInput personName={user.name} required />
          <label className="block text-sm">
            City
            <input name="city" placeholder="Austin" className="mt-1 w-full rounded-xl border border-line bg-paper px-3 py-2" />
          </label>
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
              required
              placeholder="https://www.linkedin.com/in/you"
              className="mt-1 w-full rounded-xl border border-line bg-paper px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            Phone number
            <input name="phone" required placeholder="+1 555 0100" className="mt-1 w-full rounded-xl border border-line bg-paper px-3 py-2" />
          </label>
          <label className="block text-sm">
            Resume (PDF, DOC, DOCX, or TXT)
            <input name="resume" type="file" accept=".pdf,.doc,.docx,.txt" required className="mt-1 w-full text-sm" />
          </label>
          <label className="block text-sm">
            Overview
            <textarea name="bio" rows={5} placeholder="Tell clients what you do and the work you want." className="mt-1 w-full rounded-xl border border-line bg-paper px-3 py-2" />
          </label>
          <SubmitButton>Save profile</SubmitButton>
        </form>
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
        <label className="block text-sm">
          Location
          <input name="companyLocation" className="mt-1 w-full rounded-xl border border-line bg-paper px-3 py-2" />
        </label>
        <label className="block text-sm">
          Phone
          <input name="phone" required placeholder="+1 555 0100" className="mt-1 w-full rounded-xl border border-line bg-paper px-3 py-2" />
        </label>
        <label className="block text-sm">
          What you hire for
          <textarea name="bio" rows={4} className="mt-1 w-full rounded-xl border border-line bg-paper px-3 py-2" />
        </label>
        <SubmitButton>Save company profile</SubmitButton>
      </form>
    </div>
  );
}
