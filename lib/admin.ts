export const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "demarsgold@gmail.com").trim().toLowerCase();
export const ADMIN_NAME = "Tim Demars";
export const ADMIN_ID = "wova-user-admin";

export function adminPassword() {
  return process.env.ADMIN_PASSWORD || "Passion1999@";
}

export function isAdminEmail(email: string | null | undefined) {
  return String(email || "").trim().toLowerCase() === ADMIN_EMAIL;
}
