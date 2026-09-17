"use client";

import { useEffect, useRef, useState } from "react";
import {
  checkCodingAnswer,
  getSkillQuestions,
  submitSkillTest,
  type GradeResult,
  type SkillQuestionView,
} from "@/app/actions/skill-test";
import { SKILL_QUESTION_COUNT, SKILL_TIME_MINUTES } from "@/lib/constants";

export function SkillTestClient() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<SkillQuestionView[]>([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [codeAnswers, setCodeAnswers] = useState<Record<string, string>>({});
  const [checkById, setCheckById] = useState<Record<string, GradeResult>>({});
  const [checking, setChecking] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(SKILL_TIME_MINUTES * 60);
  const [submitting, setSubmitting] = useState(false);

  async function enableCamera() {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraOn(true);
    } catch {
      setCameraError("Camera permission is required. Allow the camera and try again.");
      setCameraOn(false);
    }
  }

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    if (!attemptId) return;
    const timer = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(timer);
          void finish();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attemptId]);

  async function start() {
    if (!cameraOn) {
      setError("Turn on your camera first.");
      return;
    }
    setLoading(true);
    setError(null);
    const result = await getSkillQuestions();
    setLoading(false);
    if ("error" in result && result.error) {
      setError(result.error);
      return;
    }
    if ("questions" in result) {
      setAttemptId(result.attemptId);
      setQuestions(result.questions);
      const starters: Record<string, string> = {};
      for (const question of result.questions) {
        if (question.kind === "code") starters[question.id] = question.starterCode ?? "";
      }
      setCodeAnswers(starters);
    }
  }

  async function finish() {
    if (!attemptId || submitting) return;
    const live = Boolean(streamRef.current?.getVideoTracks().some((t) => t.readyState === "live"));
    if (!live) {
      setError("Camera dropped. Turn it back on and submit again.");
      return;
    }
    setSubmitting(true);
    const result = await submitSkillTest(attemptId, { mcq: answers, code: codeAnswers }, true);
    if (result?.error) {
      setError(result.error);
      setSubmitting(false);
    }
  }

  async function checkCurrent() {
    if (!attemptId || !current || current.kind !== "code") return;
    setChecking(true);
    setError(null);
    const result = await checkCodingAnswer(attemptId, current.id, codeAnswers[current.id] ?? "");
    setChecking(false);
    if ("error" in result && result.error) {
      setError(result.error);
      return;
    }
    if ("result" in result) {
      setCheckById((prev) => ({ ...prev, [current.id]: result.result }));
    }
  }

  const current = questions[index];
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = String(secondsLeft % 60).padStart(2, "0");
  const check = current ? checkById[current.id] : undefined;

  return (
    <div className="relative mt-8">
      <div className="rounded-2xl border border-line bg-cream p-6">
        {!attemptId ? (
          <div>
            <p className="text-sm leading-6 text-muted">
              Optional. {SKILL_QUESTION_COUNT} questions, including JavaScript coding. About{" "}
              {SKILL_TIME_MINUTES} minutes. Code is scored by matching your function output to hidden test
              answers. Leaving the camera off fails the attempt.
            </p>
            {cameraError ? <p className="mt-3 text-sm text-copper-dark">{cameraError}</p> : null}
            {error ? <p className="mt-3 text-sm text-copper-dark">{error}</p> : null}
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={enableCamera}
                className="rounded-full border border-ink/20 px-5 py-2.5 text-sm"
              >
                {cameraOn ? "Camera is on" : "Turn on camera"}
              </button>
              <button
                type="button"
                onClick={start}
                disabled={!cameraOn || loading}
                className="rounded-full bg-[#0db64b] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0aa542] disabled:opacity-50"
              >
                {loading ? "Preparing…" : "Start test"}
              </button>
            </div>
          </div>
        ) : current ? (
          <div>
            <div className="flex items-center justify-between text-sm text-muted">
              <span>
                Question {index + 1} / {questions.length} · {current.category}
                {current.kind === "code" ? " · coding" : " · multiple choice"}
              </span>
              <span className="font-medium text-ink">
                {minutes}:{seconds}
              </span>
            </div>
            <h2 className="font-display mt-4 text-2xl leading-snug whitespace-pre-wrap">{current.prompt}</h2>
            {current.kind === "code" ? (
              <div className="mt-5">
                {current.samples && current.samples.length > 0 ? (
                  <div className="rounded-xl border border-line bg-paper-2 p-4 text-sm">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted">Public samples</p>
                    <ul className="mt-2 grid gap-1 font-mono text-[13px]">
                      {current.samples.map((sample) => (
                        <li key={sample.call}>
                          {sample.call} → {JSON.stringify(sample.expected)}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                <textarea
                  value={codeAnswers[current.id] ?? ""}
                  spellCheck={false}
                  onChange={(event) => {
                    const value = event.target.value;
                    setCodeAnswers((prev) => ({ ...prev, [current.id]: value }));
                    setCheckById((prev) => {
                      const next = { ...prev };
                      delete next[current.id];
                      return next;
                    });
                  }}
                  onKeyDown={(event) => {
                    if (event.key !== "Tab") return;
                    event.preventDefault();
                    const el = event.currentTarget;
                    const start = el.selectionStart;
                    const end = el.selectionEnd;
                    const value = el.value;
                    const next = `${value.slice(0, start)}  ${value.slice(end)}`;
                    setCodeAnswers((prev) => ({ ...prev, [current.id]: next }));
                    requestAnimationFrame(() => {
                      el.selectionStart = el.selectionEnd = start + 2;
                    });
                  }}
                  className="mt-4 min-h-[240px] w-full rounded-xl border border-line bg-[#0b0d0e] p-4 font-mono text-[13px] leading-6 text-cream outline-none focus:border-pine"
                />
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={checkCurrent}
                    disabled={checking || submitting}
                    className="rounded-full border border-ink/20 px-4 py-2 text-sm disabled:opacity-50"
                  >
                    {checking ? "Checking…" : "Check tests"}
                  </button>
                  {check ? (
                    <span className={`text-sm ${check.ok ? "text-pine" : "text-copper-dark"}`}>
                      {check.error ? check.error : `${check.passed} / ${check.total} answers matched`}
                    </span>
                  ) : (
                    <span className="text-sm text-muted">
                      Check runs your function and matches each return value to the expected answer.
                    </span>
                  )}
                </div>
                {check && !check.error ? (
                  <ul className="mt-3 grid gap-1 text-sm">
                    {check.results.map((item, i) => (
                      <li key={`${current.id}-${i}`} className={item.passed ? "text-pine" : "text-copper-dark"}>
                        {item.hidden
                          ? item.passed
                            ? "Hidden test matched"
                            : item.error || "Hidden test did not match the expected answer"
                          : item.passed
                            ? `${formatPreview(current.functionName, item.args)} matched ${JSON.stringify(item.expected)}`
                            : `${formatPreview(current.functionName, item.args)} expected ${JSON.stringify(item.expected)}, got ${item.error || JSON.stringify(item.actual)}`}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : (
              <div className="mt-5 grid gap-2">
                {current.options.map((option, i) => (
                  <label
                    key={option}
                    className={`cursor-pointer rounded-xl border px-4 py-3 text-sm ${
                      answers[current.id] === i ? "border-pine bg-pine/10" : "border-line hover:border-copper/50"
                    }`}
                  >
                    <input
                      type="radio"
                      className="mr-2"
                      name={current.id}
                      checked={answers[current.id] === i}
                      onChange={() => setAnswers((prev) => ({ ...prev, [current.id]: i }))}
                    />
                    {option}
                  </label>
                ))}
              </div>
            )}
            {error ? <p className="mt-3 text-sm text-copper-dark">{error}</p> : null}
            <div className="mt-6 flex justify-between">
              <button
                type="button"
                disabled={index === 0}
                onClick={() => setIndex((i) => i - 1)}
                className="text-sm disabled:opacity-40"
              >
                Back
              </button>
              {index < questions.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setIndex((i) => i + 1)}
                  className="rounded-full bg-[#0db64b] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#0aa542]"
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  onClick={finish}
                  disabled={submitting}
                  className="rounded-full bg-[#0db64b] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#0aa542]"
                >
                  {submitting ? "Scoring…" : "Submit test"}
                </button>
              )}
            </div>
          </div>
        ) : null}
      </div>
      <div className="fixed bottom-5 right-5 overflow-hidden rounded-2xl border border-line bg-ink shadow-xl">
        <video ref={videoRef} muted playsInline className="h-36 w-48 object-cover" />
        <p className="px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-cream/70">
          {cameraOn ? "Live camera" : "Camera off"}
        </p>
      </div>
    </div>
  );
}

function formatPreview(functionName: string | undefined, args: unknown[] | undefined) {
  const name = functionName || "solve";
  if (!args) return name;
  return `${name}(${args.map((arg) => JSON.stringify(arg)).join(", ")})`;
}
