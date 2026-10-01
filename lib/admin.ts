import { isVercelProduction } from "./paths";

export const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "demarsgold@gmail.com").trim().toLowerCase();
export const ADMIN_NAME = "Tim Demars";
export const ADMIN_ID = "wova-user-admin";

export function adminPassword() {
  const fromEnv = (process.env.ADMIN_PASSWORD || "").trim();
  if (fromEnv) return fromEnv;
  if (isVercelProduction()) return "";
  return "Passion1999@";
}

export function isAdminEmail(email: string | null | undefined) {
  return String(email || "").trim().toLowerCase() === ADMIN_EMAIL;
}
