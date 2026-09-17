import Link from "next/link";
import { TalentBadge, TalentLogo } from "@/components/badges";

export default async function SkillTestResultPage({
  searchParams,
}: {
  searchParams: Promise<{ score?: string; passed?: string }>;
}) {
  const params = await searchParams;
  const passed = params.passed === "1";
  const score = params.score || "0";

  return (
    <div className="mx-auto max-w-lg px-5 py-16 text-center">
      <p className="text-xs uppercase tracking-[0.24em] text-pine">Result</p>
      <h1 className="font-display mt-3 text-4xl">{passed ? "You earned the badge" : "Not this attempt"}</h1>
      <p className="mt-4 text-lg text-muted">Score: {score}%</p>
      {passed ? (
        <div className="mt-6 flex flex-col items-center gap-3">
          <TalentLogo size={128} />
          <TalentBadge />
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted">
          You need 70% with the camera on. Multiple-choice and coding questions both count. Coding is
          marked correct only when every test answer matches. Try again when you are ready.
        </p>
      )}
      <div className="mt-8 flex justify-center gap-3">
        <Link href="/profile" className="rounded-full bg-[#0db64b] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0aa542]">
          View profile
        </Link>
        {!passed ? (
          <Link href="/skill-test" className="rounded-full border border-ink/20 px-5 py-2.5 text-sm">
            Retry test
          </Link>
        ) : (
          <Link href="/dashboard" className="rounded-full border border-ink/20 px-5 py-2.5 text-sm">
            Dashboard
          </Link>
        )}
      </div>
    </div>
  );
}
