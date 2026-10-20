export const ONLINE_MS = 2 * 60 * 1000;

export function isOnline(lastSeenAt?: Date | string | null) {
  if (!lastSeenAt) return false;
  const at = lastSeenAt instanceof Date ? lastSeenAt.getTime() : new Date(lastSeenAt).getTime();
  if (Number.isNaN(at)) return false;
  return Date.now() - at < ONLINE_MS;
}
