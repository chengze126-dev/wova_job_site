/** Canonical production host (Namecheap domain). */
export const SITE_HOST = "www.wova.cc";
export const SITE_ORIGIN = `https://${SITE_HOST}`;

function vercelOrigin() {
  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (production) return `https://${production.replace(/^https?:\/\//, "")}`;
  const preview = process.env.VERCEL_URL;
  if (preview) return `https://${preview.replace(/^https?:\/\//, "")}`;
  return "";
}

function isLocalHost(url: string) {
  return /localhost|127\.0\.0\.1/i.test(url);
}

/** Stripe return URLs, auth emails, and other absolute links. */
export function siteUrl() {
  const envUrl = (process.env.AUTH_URL || "").replace(/\/$/, "");
  if (process.env.VERCEL) {
    if (envUrl && !isLocalHost(envUrl)) return envUrl;
    if (process.env.VERCEL_ENV === "production") return SITE_ORIGIN;
    return (vercelOrigin() || SITE_ORIGIN).replace(/\/$/, "");
  }
  return (envUrl || vercelOrigin() || "http://localhost:3000").replace(/\/$/, "");
}
