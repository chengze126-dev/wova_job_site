import { DatabaseSync } from "node:sqlite";
import fs from "fs";
import path from "path";
import { dataDirectory, isVercelProduction } from "./paths";

export type Dict = Record<string, unknown>;

export type SqlStatement = {
  get(...params: unknown[]): Promise<Dict | undefined>;
  all(...params: unknown[]): Promise<Dict[]>;
  run(...params: unknown[]): Promise<void>;
};

export type SqlDatabase = {
  kind: "local" | "remote";
  exec(sql: string): Promise<void>;
  prepare(sql: string): SqlStatement;
};

const globalForSql = globalThis as unknown as {
  wovaSql?: SqlDatabase;
  wovaSqlOpening?: Promise<SqlDatabase>;
};

export function remoteDatabaseUrl() {
  const turso = process.env.TURSO_DATABASE_URL?.trim() || "";
  const databaseUrl = process.env.DATABASE_URL?.trim() || "";
  if (turso) return turso;
  if (databaseUrl.startsWith("libsql://") || databaseUrl.startsWith("libsql:") || databaseUrl.startsWith("https://")) {
    return databaseUrl;
  }
  return "";
}

export function remoteDatabaseToken() {
  return process.env.TURSO_AUTH_TOKEN?.trim() || process.env.DATABASE_AUTH_TOKEN?.trim() || "";
}

export function usesRemoteDatabase() {
  const url = remoteDatabaseUrl();
  return Boolean(url);
}

function demoDbPath() {
  return path.join(process.cwd(), "data", "demo.db");
}

function wrapSqlite(instance: DatabaseSync): SqlDatabase {
  return {
    kind: "local",
    async exec(sql: string) {
      instance.exec(sql);
    },
    prepare(sql: string) {
      const stmt = instance.prepare(sql);
      return {
        async get(...params: unknown[]) {
          const row = (params.length ? stmt.get(...params) : stmt.get()) as Dict | undefined;
          return row;
        },
        async all(...params: unknown[]) {
          const rows = (params.length ? stmt.all(...params) : stmt.all()) as Dict[];
          return rows;
        },
        async run(...params: unknown[]) {
          if (params.length) stmt.run(...params);
          else stmt.run();
        },
      };
    },
  };
}

function rowToDict(row: Record<string, unknown>): Dict {
  const dict: Dict = {};
  for (const [key, value] of Object.entries(row)) {
    if (!/^\d+$/.test(key)) dict[key] = value;
  }
  return dict;
}

async function openTurso(): Promise<SqlDatabase> {
  const url = remoteDatabaseUrl();
  const authToken = remoteDatabaseToken();
  if (!url) throw new Error("Missing TURSO_DATABASE_URL.");
  if (!authToken) throw new Error("Missing TURSO_AUTH_TOKEN.");
  const { createClient } = await import("@libsql/client");
  const client = createClient({ url, authToken });
  return {
    kind: "remote",
    async exec(sql: string) {
      try {
        await client.executeMultiple(sql);
      } catch {
        const parts = sql
          .split(";")
          .map((part) => part.trim())
          .filter(Boolean);
        for (const part of parts) {
          await client.execute(part);
        }
      }
    },
    prepare(sql: string) {
      return {
        async get(...params: unknown[]) {
          const result = await client.execute({ sql, args: params as never });
          const row = result.rows[0];
          return row ? rowToDict(row as unknown as Record<string, unknown>) : undefined;
        },
        async all(...params: unknown[]) {
          const result = await client.execute({ sql, args: params as never });
          return result.rows.map((row) => rowToDict(row as unknown as Record<string, unknown>));
        },
        async run(...params: unknown[]) {
          await client.execute({ sql, args: params as never });
        },
      };
    },
  };
}

function openLocalSqlite(): SqlDatabase {
  const dir = dataDirectory();
  fs.mkdirSync(dir, { recursive: true });
  const dest = path.join(dir, "hireline.db");
  const seedFile = demoDbPath();
  if (!isVercelProduction() && !fs.existsSync(dest) && fs.existsSync(seedFile)) {
    fs.copyFileSync(seedFile, dest);
  }
  const instance = new DatabaseSync(dest);
  instance.exec("PRAGMA foreign_keys = ON;");
  return wrapSqlite(instance);
}

export async function getSql(): Promise<SqlDatabase> {
  if (globalForSql.wovaSql) return globalForSql.wovaSql;
  if (globalForSql.wovaSqlOpening) return globalForSql.wovaSqlOpening;
  globalForSql.wovaSqlOpening = (async () => {
    if (usesRemoteDatabase()) {
      globalForSql.wovaSql = await openTurso();
      return globalForSql.wovaSql;
    }
    if (process.env.VERCEL) {
      throw new Error(
        "Production needs a hosted database. Create a free Turso database and set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in Vercel.",
      );
    }
    globalForSql.wovaSql = openLocalSqlite();
    return globalForSql.wovaSql;
  })();
  try {
    return await globalForSql.wovaSqlOpening;
  } catch (error) {
    globalForSql.wovaSqlOpening = undefined;
    throw error;
  }
}
