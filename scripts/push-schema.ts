import { readFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@libsql/client";

function loadEnv() {
  try {
    const text = readFileSync(resolve(process.cwd(), ".env"), "utf8");
    for (const line of text.split(/\r?\n/)) {
      const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (!match || process.env[match[1]]) continue;
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, "").trim();
    }
  } catch {
    /* .env is optional when vars are already in the shell */
  }
}

loadEnv();

const url = process.env.TURSO_DATABASE_URL?.trim();
const authToken = process.env.TURSO_AUTH_TOKEN?.trim();
if (!url || !authToken) {
  console.error("Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN, then run: npm run db:turso");
  process.exit(1);
}

const sql = readFileSync(resolve(process.cwd(), "lib/schema.sql"), "utf8");
const statements = sql
  .split(";")
  .map((part) => part.replace(/--[^\n]*/g, "").trim())
  .filter(Boolean);

const client = createClient({ url, authToken });

for (const statement of statements) {
  await client.execute(statement);
  const name = statement.match(/TABLE IF NOT EXISTS (\w+)|INDEX IF NOT EXISTS (\w+)/i);
  console.log("ok", name?.[1] || name?.[2] || "statement");
}

const tables = await client.execute(
  "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_litestream%' ORDER BY name",
);
console.log(
  "tables",
  tables.rows.map((row) => row.name).join(", "),
);
