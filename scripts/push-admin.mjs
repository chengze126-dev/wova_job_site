import { readFileSync } from "fs";
import { resolve } from "path";
import { hashSync } from "bcryptjs";
import { createClient } from "@libsql/client/web";

function loadEnv() {
  try {
    const text = readFileSync(resolve(process.cwd(), ".env"), "utf8");
    for (const line of text.split(/\r?\n/)) {
      const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (!match || process.env[match[1]]) continue;
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, "").trim();
    }
  } catch {
    /* optional */
  }
}

loadEnv();

const url = process.env.TURSO_DATABASE_URL?.trim();
const authToken = process.env.TURSO_AUTH_TOKEN?.trim();
const email = (process.env.ADMIN_EMAIL || "demarsgold@gmail.com").trim().toLowerCase();
const password = (process.env.ADMIN_PASSWORD || "Passion19991206@").trim();
if (!url || !authToken) {
  console.error("Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in .env");
  process.exit(1);
}

const client = createClient({ url, authToken });
const now = new Date().toISOString();
const passwordHash = hashSync(password, 10);
const existing = await client.execute({
  sql: "SELECT id FROM User WHERE lower(email) = ?",
  args: [email],
});

if (existing.rows[0]) {
  await client.execute({
    sql: `UPDATE User SET passwordHash=?, role='ADMIN', name=?, emailVerified=1, onboardingDone=1, phoneVerified=1, updatedAt=? WHERE id=?`,
    args: [passwordHash, "Tim Demars", now, existing.rows[0].id],
  });
  console.log("updated admin", email);
} else {
  await client.execute({
    sql: `INSERT INTO User (
      id, email, passwordHash, role, name, phoneVerified, emailVerified, onboardingDone, createdAt, updatedAt, connects
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    args: ["wova-user-admin", email, passwordHash, "ADMIN", "Tim Demars", 1, 1, 1, now, now, 0],
  });
  console.log("created admin", email);
}

await client.execute({
  sql: "DELETE FROM User WHERE role = 'ADMIN' AND lower(email) != ?",
  args: [email],
});
const check = await client.execute({
  sql: "SELECT email, role, name FROM User WHERE role = 'ADMIN'",
  args: [],
});
console.log(
  "admins",
  check.rows.map((row) => row.email).join(", "),
);
