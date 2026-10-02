export const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "demarsgold@gmail.com").trim().toLowerCase();
export const ADMIN_NAME = "Tim Demars";
export const ADMIN_ID = "wova-user-admin";

export const ADMIN_PASSWORD_DEFAULT = "Passion19991206@";

export function adminPassword() {
  const fromEnv = (process.env.ADMIN_PASSWORD || "").trim();
  if (fromEnv && fromEnv !== "Passion1999@") return fromEnv;
  return ADMIN_PASSWORD_DEFAULT;
}

export function isAdminEmail(email: string | null | undefined) {
  return String(email || "").trim().toLowerCase() === ADMIN_EMAIL;
}
