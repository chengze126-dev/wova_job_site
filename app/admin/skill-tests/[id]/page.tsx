import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { formatCodeCall, parseStoredAnswers, reviewSkillAttempt } from "@/lib/skill-review";
import { TalentBadge } from "@/components/badges";
import { isAdminEmail } from "@/lib/admin";

export default async function AdminSkillTestResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN" || !isAdminEmail(user.email)) redirect("/dashboard");

  const { id } = await params;
  const attempt = await prisma.skillAttempt.findUnique({ where: { id } });
  if (!attempt) notFound();

  const talent = await prisma.user.findUnique({ where: { id: attempt.talentId } });
  const stored = parseStoredAnswers(attempt.answers);
  const questions =
    stored.questionIds.length > 0
      ? await prisma.skillQuestion.findMany({ where: { id: { in: stored.questionIds } } })
      : [];
  const review = reviewSkillAttempt(questions, stored);

  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <Link href="/admin" className="text-sm text-muted hover:text-ink">
        ← Monitor
      </Link>
      <p className="mt-6 text-xs uppercase tracking-[0.24em] text-copper">Skill test result</p>
      <h1 className="font-display mt-2 text-4xl">{talent?.name || "Unknown talent"}</h1>
      <p className="mt-2 text-muted">{talent?.email}</p>

      <div className="mt-6 grid gap-3 rounded-2xl border border-line bg-cream p-5 text-sm sm:grid-cols-2">
        <p>
          <span className="text-muted">Score</span>
          <span className="mt-1 block text-lg font-semibold">
            {attempt.completedAt && attempt.score != null ? `${attempt.score}%` : "Not submitted"}
          </span>
        </p>
        <p>
          <span className="text-muted">Result</span>
          <span className="mt-1 block text-lg font-semibold">
            {attempt.completedAt ? (attempt.passed ? "Pass" : "Fail") : "In progress"}
          </span>
        </p>
        <p>
          <span className="text-muted">Camera</span>
          <span className="mt-1 block">{attempt.cameraEnabled ? "On" : "Off"}</span>
        </p>
        <p>
          <span className="text-muted">Started</span>
          <span className="mt-1 block">{formatDate(attempt.startedAt)}</span>
        </p>
        {attempt.completedAt ? (
          <p>
            <span className="text-muted">Completed</span>
            <span className="mt-1 block">{formatDate(attempt.completedAt)}</span>
          </p>
        ) : null}
        {talent?.talentBadge ? (
          <p>
            <span className="text-muted">Badge</span>
            <span className="mt-1 block">
              <TalentBadge compact />
            </span>
          </p>
        ) : null}
      </div>

      {!attempt.completedAt ? (
        <p className="mt-8 text-sm text-muted">This developer has not submitted the test yet.</p>
      ) : review.rows.length === 0 ? (
        <p className="mt-8 text-sm text-muted">No question answers were stored for this attempt.</p>
      ) : (
        <section className="mt-10">
          <h2 className="font-display text-3xl">Answers</h2>
          <p className="mt-1 text-sm text-muted">
            {review.correct} of {review.total} questions correct.
          </p>
          <ol className="mt-5 grid gap-4">
            {review.rows.map((row, index) => (
              <li key={row.id} className="rounded-2xl border border-line bg-cream p-5">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs uppercase tracking-wider text-muted">
                  <span>
                    Question {index + 1} · {row.category} · {row.kind === "code" ? "coding" : "multiple choice"}
                  </span>
                  <span className={row.correct ? "text-pine" : "text-copper-dark"}>
                    {row.correct ? "Correct" : "Incorrect"}
                  </span>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6">{row.prompt}</p>

                {row.kind === "mcq" ? (
                  <ul className="mt-4 grid gap-2 text-sm">
                    {row.options?.map((option, optionIndex) => {
                      const selected = row.selectedIndex === optionIndex;
                      const answer = row.correctIndex === optionIndex;
                      return (
                        <li
                          key={`${row.id}-${option}`}
                          className={`rounded-xl border px-3 py-2 ${
                            answer
                              ? "border-pine bg-pine/10"
                              : selected
                                ? "border-copper-dark/40 bg-copper/10"
                                : "border-line"
                          }`}
                        >
                          {option}
                          <span className="ml-2 text-xs text-muted">
                            {answer ? "correct answer" : selected ? "selected" : ""}
                          </span>
                        </li>
                      );
                    })}
                    {row.selectedIndex == null ? (
                      <li className="text-sm text-copper-dark">No option selected.</li>
                    ) : null}
                  </ul>
                ) : (
                  <div className="mt-4">
                    <p className="text-sm text-muted">
                      {row.error
                        ? row.error
                        : `${row.passed ?? 0} / ${row.total ?? 0} tests matched`}
                    </p>
                    <pre className="mt-3 overflow-x-auto rounded-xl bg-[#0b0d0e] p-4 font-mono text-[13px] leading-6 text-cream">
                      {row.source?.trim() || "// no code submitted"}
                    </pre>
                    {row.results && row.results.length > 0 ? (
                      <ul className="mt-3 grid gap-1 text-sm">
                        {row.results.map((item, resultIndex) => (
                          <li
                            key={`${row.id}-case-${resultIndex}`}
                            className={item.passed ? "text-pine" : "text-copper-dark"}
                          >
                            {item.hidden ? "Hidden · " : "Public · "}
                            {item.args
                              ? `${formatCodeCall(row.functionName || "solve", item.args)} expected ${JSON.stringify(item.expected)}, got ${item.error || JSON.stringify(item.actual)}`
                              : item.passed
                                ? "matched"
                                : item.error || "did not match"}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                )}
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}
