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

/** Stripe return URLs, metadata, and other absolute links. */
export function siteUrl() {
  return (process.env.AUTH_URL || vercelOrigin() || SITE_ORIGIN).replace(/\/$/, "");
}
