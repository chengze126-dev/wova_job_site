"use client";

import { useEffect, useRef, useState } from "react";
import { getSkillQuestions, pingSkillTest, submitSkillTest, type SkillQuestionView } from "@/app/actions/skill-test";
import { SKILL_TIME_MINUTES } from "@/lib/constants";
import { PROBLEMS_PER_STACK, QUESTIONS_PER_TEST, SKILL_STACKS } from "@/lib/skill-stacks";
import { IntroVideoRecorder } from "@/components/intro-video-recorder";

function captureFrame(video: HTMLVideoElement | null) {
  if (!video || video.readyState < 2) return null;
  const canvas = document.createElement("canvas");
  canvas.width = 320;
  canvas.height = 240;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(video, 0, 0, 320, 240);
  return canvas.toDataURL("image/jpeg", 0.42);
}

export function SkillTestClient({
  introVideoUrl,
  introVideoSeconds,
}: {
  introVideoUrl?: string | null;
  introVideoSeconds?: number | null;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const attemptIdRef = useRef<string | null>(null);
  const indexRef = useRef(0);
  const [intro, setIntro] = useState({
    url: introVideoUrl || "",
    seconds: introVideoSeconds || 0,
  });
  const [recordingIntro, setRecordingIntro] = useState(!introVideoUrl);
  const [stack, setStack] = useState(SKILL_STACKS[0]?.slug ?? "javascript");
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [stackName, setStackName] = useState("");
  const [questions, setQuestions] = useState<SkillQuestionView[]>([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [secondsLeft, setSecondsLeft] = useState(SKILL_TIME_MINUTES * 60);
  const [submitting, setSubmitting] = useState(false);

  attemptIdRef.current = attemptId;
  indexRef.current = index;

  async function enableCamera() {
    setCameraError(null);
    try {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 },
        audio: false,
      });
      streamRef.current = stream;
      stream.getVideoTracks().forEach((track) => {
        track.addEventListener("ended", () => {
          setCameraOn(false);
          setCameraError("Camera turned off. Turn it back on to continue the test.");
        });
      });
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
    if (recordingIntro || !intro.url) return;
    void enableCamera();
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordingIntro, intro.url]);

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

  useEffect(() => {
    if (!attemptId) return;
    let cancelled = false;

    async function beat() {
      const id = attemptIdRef.current;
      if (!id || cancelled) return;
      const live = Boolean(streamRef.current?.getVideoTracks().some((t) => t.readyState === "live"));
      if (!live) setCameraOn(false);
      await pingSkillTest(id, {
        cameraOn: live,
        questionIndex: indexRef.current,
        frame: live ? captureFrame(videoRef.current) : null,
      });
    }

    void beat();
    const timer = setInterval(() => {
      void beat();
    }, 2000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [attemptId]);

  async function start() {
    const live = Boolean(streamRef.current?.getVideoTracks().some((t) => t.readyState === "live"));
    if (!live) {
      setError("Turn on your camera first. Admin must see you during the test.");
      void enableCamera();
      return;
    }
    setLoading(true);
    setError(null);
    const result = await getSkillQuestions(stack);
    setLoading(false);
    if ("error" in result && result.error) {
      setError(result.error);
      return;
    }
    if ("questions" in result) {
      setAttemptId(result.attemptId);
      setStackName(result.stack);
      setQuestions(result.questions);
      setIndex(0);
      setAnswers({});
      setSecondsLeft(SKILL_TIME_MINUTES * 60);
    }
  }

  async function finish() {
    if (!attemptId || submitting) return;
    const live = Boolean(streamRef.current?.getVideoTracks().some((t) => t.readyState === "live"));
    if (!live) {
      setError("Camera dropped. Turn it back on so admin can see you, then submit again.");
      void enableCamera();
      return;
    }
    await pingSkillTest(attemptId, {
      cameraOn: true,
      questionIndex: index,
      frame: captureFrame(videoRef.current),
    });
    setSubmitting(true);
    const result = await submitSkillTest(attemptId, { mcq: answers });
    if (result?.error) {
      setError(result.error);
      setSubmitting(false);
    }
  }

  const current = questions[index];
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = String(secondsLeft % 60).padStart(2, "0");
  const selected = SKILL_STACKS.find((item) => item.slug === stack);
  const cameraBlocked = Boolean(attemptId) && !cameraOn;

  if (recordingIntro || !intro.url) {
    return (
      <div className="mt-8 rounded-2xl border border-line bg-cream p-6">
        <IntroVideoRecorder
          existingUrl={intro.url || null}
          existingSeconds={intro.seconds || null}
          onSaved={(payload) => {
            setIntro(payload);
            setRecordingIntro(false);
          }}
          onCancel={intro.url ? () => setRecordingIntro(false) : undefined}
        />
      </div>
    );
  }

  return (
    <div className="relative mt-8">
      <div className="rounded-2xl border border-line bg-cream p-6">
        {!attemptId ? (
          <div>
            <p className="text-sm font-semibold text-ink">Choose a stack</p>
            <p className="mt-1 text-sm leading-6 text-muted">
              {SKILL_STACKS.length} main stacks · {PROBLEMS_PER_STACK.toLocaleString()} problems each ·{" "}
              {QUESTIONS_PER_TEST} shown per test.
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {SKILL_STACKS.map((item) => (
                <button
                  key={item.slug}
                  type="button"
                  onClick={() => setStack(item.slug)}
                  className={`rounded-xl border px-4 py-3 text-left transition ${
                    stack === item.slug ? "border-pine bg-pine/10" : "border-line hover:border-pine/40"
                  }`}
                >
                  <span className="block text-sm font-semibold text-ink">{item.name}</span>
                  <span className="mt-0.5 block text-xs text-muted">{item.blurb}</span>
                </button>
              ))}
            </div>
            <p className="mt-5 text-sm leading-6 text-muted">
              Selected: <span className="font-semibold text-ink">{selected?.name}</span>. Your camera must stay
              on for {SKILL_TIME_MINUTES} minutes so an admin can watch your test. Pass at 70% to earn the
              Talent badge.
            </p>
            <p className="mt-2 text-sm text-pine">
              English introduction saved ({Math.floor(intro.seconds / 60)}:{String(intro.seconds % 60).padStart(2, "0")}
              ). Admin can watch it.
            </p>
            {cameraError ? <p className="mt-3 text-sm text-copper-dark">{cameraError}</p> : null}
            {error ? <p className="mt-3 text-sm text-copper-dark">{error}</p> : null}
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  streamRef.current?.getTracks().forEach((track) => track.stop());
                  setCameraOn(false);
                  setRecordingIntro(true);
                }}
                className="rounded-full border border-ink/20 px-5 py-2.5 text-sm"
              >
                Re-record intro
              </button>
              <button
                type="button"
                onClick={() => void enableCamera()}
                className="rounded-full border border-ink/20 px-5 py-2.5 text-sm"
              >
                {cameraOn ? "Camera is on" : "Allow camera"}
              </button>
              <button
                type="button"
                onClick={start}
                disabled={!cameraOn || loading}
                className="rounded-full bg-[#0db64b] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0aa542] disabled:opacity-50"
              >
                {loading ? "Preparing…" : `Start ${selected?.name ?? "stack"} test`}
              </button>
            </div>
          </div>
        ) : current ? (
          <div className="relative">
            {cameraBlocked ? (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-xl bg-cream/95 p-6 text-center">
                <p className="text-sm font-semibold text-ink">Camera required</p>
                <p className="mt-2 max-w-sm text-sm leading-6 text-muted">
                  Your camera dropped. Turn it back on so the admin can keep monitoring this test.
                </p>
                <button
                  type="button"
                  onClick={() => void enableCamera()}
                  className="mt-4 rounded-full bg-[#0db64b] px-5 py-2.5 text-sm font-semibold text-white"
                >
                  Turn camera back on
                </button>
              </div>
            ) : null}
            <div className="flex items-center justify-between text-sm text-muted">
              <span>
                {stackName} · Question {index + 1} / {questions.length}
              </span>
              <span className="font-medium text-ink">
                {minutes}:{seconds}
              </span>
            </div>
            <h2 className="font-display mt-4 text-2xl leading-snug whitespace-pre-wrap">{current.prompt}</h2>
            <div className="mt-5 grid gap-2">
              {current.options.map((option, i) => (
                <label
                  key={`${current.id}-${i}`}
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
                    disabled={cameraBlocked}
                  />
                  {option}
                </label>
              ))}
            </div>
            {error ? <p className="mt-3 text-sm text-copper-dark">{error}</p> : null}
            <div className="mt-6 flex justify-between">
              <button
                type="button"
                disabled={index === 0 || cameraBlocked}
                onClick={() => setIndex((i) => i - 1)}
                className="text-sm disabled:opacity-40"
              >
                Back
              </button>
              {index < questions.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setIndex((i) => i + 1)}
                  disabled={cameraBlocked}
                  className="rounded-full bg-[#0db64b] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#0aa542] disabled:opacity-50"
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  onClick={finish}
                  disabled={submitting || cameraBlocked}
                  className="rounded-full bg-[#0db64b] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#0aa542] disabled:opacity-50"
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
          {cameraOn ? "Live camera · admin can see you" : "Camera off"}
        </p>
      </div>
    </div>
  );
}
