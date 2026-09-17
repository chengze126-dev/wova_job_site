export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-5 py-24 text-center">
      <p className="text-xs uppercase tracking-[0.24em] text-copper">404</p>
      <h1 className="font-display mt-2 text-4xl">That page is not on Wova</h1>
      <a href="/" className="mt-6 inline-block text-sm underline decoration-copper/50">
        Back home
      </a>
    </div>
  );
}
