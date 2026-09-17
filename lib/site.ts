/** Canonical production host (Namecheap domain). */
export const SITE_HOST = "www.wova.cc";
export const SITE_ORIGIN = `https://${SITE_HOST}`;

/** Stripe return URLs, metadata, and other absolute links. */
export function siteUrl() {
  return (process.env.AUTH_URL || SITE_ORIGIN).replace(/\/$/, "");
}
