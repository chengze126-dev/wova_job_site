"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-md px-5 py-24 text-center">
      <h1 className="text-2xl font-bold text-ink">This page couldn’t load</h1>
      <p className="mt-3 text-sm text-muted">
        {error.message || "A server error occurred. Reload to try again."}
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-full bg-[#0db64b] px-5 py-2 text-sm font-semibold text-white"
      >
        Reload
      </button>
    </div>
  );
}
