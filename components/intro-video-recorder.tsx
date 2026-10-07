"use client";

import { useEffect, useRef, useState } from "react";
import { saveSkillIntroVideo } from "@/app/actions/skill-test";
import { INTRO_MAX_SECONDS, INTRO_MIN_SECONDS } from "@/lib/constants";

function formatClock(total: number) {
  const safe = Math.max(0, Math.floor(total));
  const minutes = Math.floor(safe / 60);
  const seconds = String(safe % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function pickMime() {
  const types = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm", "video/mp4"];
  return types.find((type) => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(type)) || "";
}

export function IntroVideoRecorder({
  existingUrl,
  existingSeconds,
  onSaved,
  onCancel,
}: {
  existingUrl?: string | null;
  existingSeconds?: number | null;
  onSaved: (payload: { url: string; seconds: number }) => void;
  onCancel?: () => void;
}) {
  const liveRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef(0);
  const [cameraOn, setCameraOn] = useState(false);
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewSeconds, setPreviewSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function enableCamera() {
    setError(null);
    try {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 1280, height: 720 },
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      streamRef.current = stream;
      if (liveRef.current) {
        liveRef.current.srcObject = stream;
        await liveRef.current.play();
      }
      setCameraOn(true);
    } catch {
      setCameraOn(false);
      setError("Allow camera and microphone. Admins watch this English introduction.");
    }
  }

  useEffect(() => {
    void enableCamera();
    return () => {
      recorderRef.current?.stop();
      streamRef.current?.getTracks().forEach((track) => track.stop());
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!recording) return;
    const timer = setInterval(() => {
      const seconds = Math.floor((Date.now() - startedAtRef.current) / 1000);
      setElapsed(seconds);
      if (seconds >= INTRO_MAX_SECONDS) stopRecording();
    }, 250);
    return () => clearInterval(timer);
  }, [recording]);

  function stopRecording() {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") return;
    recorder.stop();
  }

  function startRecording() {
    const stream = streamRef.current;
    if (!stream) {
      void enableCamera();
      setError("Turn on camera and microphone first.");
      return;
    }
    setError(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    chunksRef.current = [];
    const mime = pickMime();
    const recorder = mime
      ? new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 350_000, audioBitsPerSecond: 48_000 })
      : new MediaRecorder(stream);
    recorderRef.current = recorder;
    recorder.ondataavailable = (event) => {
      if (event.data.size) chunksRef.current.push(event.data);
    };
    recorder.onstop = () => {
      const seconds = Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000));
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "video/webm" });
      setPreviewUrl(URL.createObjectURL(blob));
      setPreviewSeconds(seconds);
      setRecording(false);
      setElapsed(seconds);
    };
    startedAtRef.current = Date.now();
    setElapsed(0);
    setRecording(true);
    recorder.start(1000);
  }

  async function submit() {
    if (!previewUrl || previewSeconds < INTRO_MIN_SECONDS) {
      setError("Speak in English for at least 2 minutes, then submit.");
      return;
    }
    if (previewSeconds > INTRO_MAX_SECONDS + 8) {
      setError("Keep the introduction to 5 minutes or less.");
      return;
    }
    setSaving(true);
    setError(null);
    const blob = await fetch(previewUrl).then((res) => res.blob());
    const ext = blob.type.includes("mp4") ? "mp4" : "webm";
    const file = new File([blob], `intro.${ext}`, { type: blob.type || "video/webm" });
    const form = new FormData();
    form.set("video", file);
    form.set("seconds", String(previewSeconds));
    const result = await saveSkillIntroVideo(form);
    setSaving(false);
    if ("error" in result && result.error) {
      setError(result.error);
      return;
    }
    if ("ok" in result) onSaved({ url: result.url, seconds: result.seconds });
  }

  const readyToStop = elapsed >= INTRO_MIN_SECONDS;
  const remaining = Math.max(0, INTRO_MIN_SECONDS - elapsed);

  return (
    <div>
      <p className="text-sm font-semibold text-ink">English introduction video</p>
      <p className="mt-1 text-sm leading-6 text-muted">
        Record yourself speaking English for 2–5 minutes before the tech test. Say your name, your stack, and
        recent work. An admin will watch this video.
      </p>
      {existingUrl ? (
        <p className="mt-3 text-sm text-pine">
          You already recorded a {formatClock(existingSeconds || 0)} introduction. Record again to replace it, or
          continue below after it is saved.
        </p>
      ) : null}

      <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-ink">
        {previewUrl && !recording ? (
          <video src={previewUrl} controls playsInline className="aspect-video w-full bg-black" />
        ) : (
          <video ref={liveRef} muted playsInline className="aspect-video w-full bg-black object-cover" />
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
        <p className="font-semibold text-ink">
          {recording ? `Recording ${formatClock(elapsed)}` : previewUrl ? `Recorded ${formatClock(previewSeconds)}` : "Not recording"}
        </p>
        <p className="text-muted">
          {recording && !readyToStop ? `Keep speaking for ${formatClock(remaining)}` : "Required: 2:00 – 5:00, English"}
        </p>
      </div>

      {error ? <p className="mt-3 text-sm text-copper-dark">{error}</p> : null}

      <div className="mt-5 flex flex-wrap gap-3">
        <button type="button" onClick={() => void enableCamera()} className="rounded-full border border-ink/20 px-5 py-2.5 text-sm">
          {cameraOn ? "Camera and mic on" : "Allow camera and mic"}
        </button>
        {recording ? (
          <button
            type="button"
            onClick={stopRecording}
            disabled={!readyToStop}
            className="rounded-full bg-[#0db64b] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {readyToStop ? "Stop recording" : `Stop after ${formatClock(remaining)}`}
          </button>
        ) : (
          <button
            type="button"
            onClick={startRecording}
            disabled={!cameraOn}
            className="rounded-full bg-[#0db64b] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {previewUrl ? "Re-record" : "Start introduction"}
          </button>
        )}
        {previewUrl && !recording ? (
          <button
            type="button"
            onClick={() => void submit()}
            disabled={saving || previewSeconds < INTRO_MIN_SECONDS}
            className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save and continue"}
          </button>
        ) : null}
        {existingUrl && onCancel ? (
          <button type="button" onClick={onCancel} className="rounded-full border border-ink/20 px-5 py-2.5 text-sm">
            Keep current intro
          </button>
        ) : null}
      </div>
    </div>
  );
}
