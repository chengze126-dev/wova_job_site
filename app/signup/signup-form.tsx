"use client";

import Link from "next/link";
import { useActionState, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { BriefcaseBusiness, Laptop } from "lucide-react";
import { registerUser } from "@/app/actions/auth";
import { COUNTRIES } from "@/lib/constants";
import { passwordRules } from "@/lib/password";
import { AuthDivider, AuthError, AuthField, AuthSubmit, SocialAuthButtons, authInputClass } from "@/components/auth-shell";

type Role = "CLIENT" | "TALENT";

export default function SignupForm() {
  const params = useSearchParams();
  const preset = params.get("role") === "CLIENT" || params.get("role") === "TALENT" ? (params.get("role") as Role) : null;
  const [role, setRole] = useState<Role | null>(preset);
  const [password, setPassword] = useState("");
  const [socialNote, setSocialNote] = useState("");
  const [state, action] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => registerUser(formData),
    null,
  );

  if (!role) {
    return <RolePicker onSelect={setRole} />;
  }

  const rules = passwordRules(password);
  const title = role === "CLIENT" ? "Create your hiring account" : "Create your talent profile";

  return (
    <div>
      <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#0db64b]">
        {role === "CLIENT" ? "Employer" : "Talent"}
      </p>
      <h1 className="mt-1.5 text-[24px] font-bold tracking-[-0.04em] text-ink">{title}</h1>
      <p className="mt-1.5 text-[13px] text-muted">
        Signing up as {role === "CLIENT" ? "an employer" : "talent"}.{" "}
        <button type="button" className="font-semibold text-[#0db64b] hover:underline" onClick={() => setRole(null)}>
          Switch
        </button>
      </p>

      <div className="mt-4">
        <SocialAuthButtons
          onUnavailable={(provider) =>
            setSocialNote(`${provider} sign-up is not enabled yet. Create your account with email.`)
          }
        />
      </div>

      <div className="my-3.5">
        <AuthDivider />
      </div>

      <form action={action} className="space-y-2.5">
        <input type="hidden" name="role" value={role} />
        <AuthError message={state?.error || socialNote} />

        <div className="grid gap-2.5 sm:grid-cols-2">
          <AuthField label="First name">
            <input name="firstName" required autoComplete="given-name" className={authInputClass} />
          </AuthField>
          <AuthField label="Last name">
            <input name="lastName" required autoComplete="family-name" className={authInputClass} />
          </AuthField>
        </div>

        <AuthField label="Email">
          <input name="email" type="email" required autoComplete="email" className={authInputClass} />
        </AuthField>

        <AuthField label="Password">
          <input
            name="password"
            type="password"
            required
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={authInputClass}
          />
        </AuthField>

        <ul className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-muted">
          <Rule ok={rules.length} label="8+ characters" />
          <Rule ok={rules.letter} label="A letter" />
          <Rule ok={rules.number} label="A number" />
          <Rule ok={rules.special} label="A symbol" />
        </ul>

        <AuthField label="Country">
          <select name="country" required defaultValue="" className={authInputClass}>
            <option value="" disabled>
              Select your country
            </option>
            {COUNTRIES.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
        </AuthField>

        <label className="flex items-start gap-2.5 text-[12px] leading-5 text-[#475569]">
          <input type="checkbox" name="marketing" className="mt-0.5 h-4 w-4 accent-[#0db64b]" />
          Email me openings and hiring tips.
        </label>

        <label className="flex items-start gap-2.5 text-[12px] leading-5 text-[#475569]">
          <input type="checkbox" name="agree" required className="mt-0.5 h-4 w-4 accent-[#0db64b]" />
          <span>
            I agree to Wova’s Terms, User Agreement, and Privacy Policy.
          </span>
        </label>

        <AuthSubmit>Create account</AuthSubmit>
      </form>

      <p className="mt-3.5 text-center text-[13px] text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-[#0db64b] hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}

function RolePicker({ onSelect }: { onSelect: (role: Role) => void }) {
  const [picked, setPicked] = useState<Role | null>(null);

  return (
    <div>
      <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#0db64b]">Get started</p>
      <h1 className="mt-1.5 text-[24px] font-bold tracking-[-0.04em] text-ink">How will you use Wova?</h1>
      <p className="mt-1.5 text-[13px] text-muted">Choose your path. You can finish your profile after you create an account.</p>

      <div className="mt-4 space-y-2.5">
        <RoleCard
          selected={picked === "CLIENT"}
          icon={<BriefcaseBusiness size={22} />}
          kicker="Employer"
          title="I hire people"
          body="Post roles and review talent."
          onSelect={() => setPicked("CLIENT")}
        />
        <RoleCard
          selected={picked === "TALENT"}
          icon={<Laptop size={22} />}
          kicker="Talent"
          title="I do the work"
          body="Build a profile and apply with connects."
          onSelect={() => setPicked("TALENT")}
        />
      </div>

      <button
        type="button"
        disabled={!picked}
        onClick={() => picked && onSelect(picked)}
        className="mt-4 w-full rounded-[10px] bg-[#0db64b] py-[11px] text-[14px] font-semibold text-white shadow-[0_8px_20px_rgba(13,182,75,0.22)] transition hover:bg-[#0aa542] disabled:cursor-not-allowed disabled:bg-[#c5d4cc] disabled:shadow-none"
      >
        Continue
      </button>

      <p className="mt-3.5 text-center text-[13px] text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-[#0db64b] hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}

function RoleCard({
  selected,
  icon,
  kicker,
  title,
  body,
  onSelect,
}: {
  selected: boolean;
  icon: ReactNode;
  kicker: string;
  title: string;
  body: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full items-start gap-3.5 rounded-[12px] border px-4 py-3 text-left transition ${
        selected ? "border-[#0db64b] bg-brand/10 shadow-[inset_3px_0_0_#0db64b]" : "border-line bg-cream hover:border-[#c5d4cc]"
      }`}
    >
      <span className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] ${selected ? "bg-brand/10 text-[#0db64b]" : "bg-paper-2 text-muted"}`}>
        {icon}
      </span>
      <span>
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#0db64b]">{kicker}</span>
        <span className="mt-0.5 block text-[16px] font-semibold text-ink">{title}</span>
        <span className="mt-0.5 block text-[13px] text-muted">{body}</span>
      </span>
    </button>
  );
}

function Rule({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className={ok ? "text-[#0db64b]" : "text-muted"}>
      {ok ? "✓" : "○"} {label}
    </li>
  );
}
