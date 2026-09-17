import { DatabaseSync } from "node:sqlite";
import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";
import { DEMO_EXTRAS, stringifyExtras } from "./profile-extras";

type Dict = Record<string, unknown>;

const globalForDb = globalThis as unknown as { hirelineDb?: DatabaseSync };

function dataDir() {
  // Vercel’s serverless filesystem is read-only except /tmp.
  if (process.env.VERCEL) return "/tmp/wova-data";
  return path.join(process.cwd(), "data");
}

function db() {
  if (globalForDb.hirelineDb) return globalForDb.hirelineDb;
  const dir = dataDir();
  fs.mkdirSync(dir, { recursive: true });
  const instance = new DatabaseSync(path.join(dir, "hireline.db"));
  instance.exec("PRAGMA foreign_keys = ON;");
  migrate(instance);
  globalForDb.hirelineDb = instance;
  return instance;
}

function ensureCodingQuestions(instance: DatabaseSync) {
  const row = instance.prepare("SELECT COUNT(*) AS c FROM SkillQuestion WHERE kind = 'code'").get() as
    | { c: number }
    | undefined;
  if (row && Number(row.c) > 0) return;

  const stmt = instance.prepare(
    "INSERT INTO SkillQuestion (id, prompt, options, correctIndex, category, kind, starterCode, functionName, tests) VALUES (?,?,?,?,?,?,?,?,?)",
  );
  for (const item of CODING_QUESTIONS.map(toCodeQuestionRow)) {
    stmt.run(
      randomUUID(),
      item.prompt,
      item.options,
      item.correctIndex,
      item.category,
      item.kind,
      item.starterCode,
      item.functionName,
      item.tests,
    );
  }
}

function migrate(instance: DatabaseSync) {
  instance.exec(`
    CREATE TABLE IF NOT EXISTS User (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      passwordHash TEXT NOT NULL,
      role TEXT NOT NULL,
      name TEXT NOT NULL,
      country TEXT,
      phone TEXT,
      phoneVerified INTEGER NOT NULL DEFAULT 0,
      phoneOtpHash TEXT,
      phoneOtpExpires TEXT,
      bio TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      linkedinUrl TEXT,
      resumeUrl TEXT,
      avatarUrl TEXT,
      title TEXT,
      hourlyRate INTEGER,
      skills TEXT,
      extras TEXT,
      skillTestPassed INTEGER NOT NULL DEFAULT 0,
      talentBadge INTEGER NOT NULL DEFAULT 0,
      connects INTEGER NOT NULL DEFAULT 0,
      onboardingDone INTEGER NOT NULL DEFAULT 0,
      companyName TEXT,
      companySize TEXT,
      companyIndustry TEXT,
      companyWebsite TEXT,
      companyLocation TEXT,
      stripeCustomerId TEXT,
      paymentConnected INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS Job (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      skills TEXT NOT NULL,
      budgetMin INTEGER,
      budgetMax INTEGER,
      budgetType TEXT NOT NULL DEFAULT 'fixed',
      highBadge INTEGER NOT NULL DEFAULT 0,
      connectCost INTEGER NOT NULL DEFAULT 10,
      status TEXT NOT NULL DEFAULT 'OPEN',
      clientId TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (clientId) REFERENCES User(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS Application (
      id TEXT PRIMARY KEY,
      jobId TEXT NOT NULL,
      talentId TEXT NOT NULL,
      coverLetter TEXT NOT NULL,
      connectsUsed INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING',
      attachmentUrl TEXT,
      attachmentName TEXT,
      createdAt TEXT NOT NULL,
      UNIQUE(jobId, talentId),
      FOREIGN KEY (jobId) REFERENCES Job(id) ON DELETE CASCADE,
      FOREIGN KEY (talentId) REFERENCES User(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS Conversation (
      id TEXT PRIMARY KEY,
      userAId TEXT NOT NULL,
      userBId TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      UNIQUE(userAId, userBId),
      FOREIGN KEY (userAId) REFERENCES User(id) ON DELETE CASCADE,
      FOREIGN KEY (userBId) REFERENCES User(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS Message (
      id TEXT PRIMARY KEY,
      conversationId TEXT NOT NULL,
      senderId TEXT NOT NULL,
      content TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (conversationId) REFERENCES Conversation(id) ON DELETE CASCADE,
      FOREIGN KEY (senderId) REFERENCES User(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS SkillQuestion (
      id TEXT PRIMARY KEY,
      prompt TEXT NOT NULL,
      options TEXT NOT NULL,
      correctIndex INTEGER NOT NULL,
      category TEXT NOT NULL,
      kind TEXT NOT NULL DEFAULT 'mcq',
      starterCode TEXT,
      functionName TEXT,
      tests TEXT
    );
    CREATE TABLE IF NOT EXISTS SkillAttempt (
      id TEXT PRIMARY KEY,
      talentId TEXT NOT NULL,
      startedAt TEXT NOT NULL,
      completedAt TEXT,
      score INTEGER,
      passed INTEGER NOT NULL DEFAULT 0,
      cameraEnabled INTEGER NOT NULL DEFAULT 0,
      answers TEXT,
      FOREIGN KEY (talentId) REFERENCES User(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS ConnectPurchase (
      id TEXT PRIMARY KEY,
      talentId TEXT NOT NULL,
      connects INTEGER NOT NULL,
      amountCents INTEGER NOT NULL,
      stripeSessionId TEXT UNIQUE,
      status TEXT NOT NULL DEFAULT 'completed',
      createdAt TEXT NOT NULL,
      FOREIGN KEY (talentId) REFERENCES User(id) ON DELETE CASCADE
    );
  `);
  try {
    instance.exec("ALTER TABLE User ADD COLUMN country TEXT");
  } catch {
    // column already exists
  }
  try {
    instance.exec("ALTER TABLE Application ADD COLUMN attachmentUrl TEXT");
  } catch {
    // column already exists
  }
  try {
    instance.exec("ALTER TABLE Application ADD COLUMN attachmentName TEXT");
  } catch {
    // column already exists
  }
  try {
    instance.exec("ALTER TABLE SkillQuestion ADD COLUMN kind TEXT NOT NULL DEFAULT 'mcq'");
  } catch {
    // column already exists
  }
  try {
    instance.exec("ALTER TABLE SkillQuestion ADD COLUMN starterCode TEXT");
  } catch {
    // column already exists
  }
  try {
    instance.exec("ALTER TABLE SkillQuestion ADD COLUMN functionName TEXT");
  } catch {
    // column already exists
  }
  try {
    instance.exec("ALTER TABLE SkillQuestion ADD COLUMN tests TEXT");
  } catch {
    // column already exists
  }
  for (const column of ["avatarUrl TEXT", "title TEXT", "hourlyRate INTEGER", "skills TEXT", "extras TEXT"]) {
    try {
      instance.exec(`ALTER TABLE User ADD COLUMN ${column}`);
    } catch {
      // column already exists
    }
  }
  instance
    .prepare(
      `UPDATE User SET avatarUrl=?, title=?, hourlyRate=?, skills=? WHERE email=? AND (avatarUrl IS NULL OR avatarUrl='')`,
    )
    .run(
      "/avatars/maya.jpg",
      "Product Designer & Front-End Engineer",
      75,
      JSON.stringify(["React", "Figma", "TypeScript", "UI design"]),
      "maya@talent.test",
    );
  instance
    .prepare(
      `UPDATE User SET avatarUrl=?, title=?, hourlyRate=?, skills=? WHERE email=? AND (avatarUrl IS NULL OR avatarUrl='')`,
    )
    .run(
      "/avatars/diego.jpg",
      "Full-Stack TypeScript Developer",
      85,
      JSON.stringify(["Next.js", "Node.js", "PostgreSQL", "Payments"]),
      "diego@talent.test",
    );
  instance
    .prepare(
      `UPDATE User SET avatarUrl=?, title=?, hourlyRate=?, skills=? WHERE email=? AND (avatarUrl IS NULL OR avatarUrl='')`,
    )
    .run(
      "/avatars/coder.jpg",
      "JavaScript Developer",
      40,
      JSON.stringify(["JavaScript", "Algorithms", "HTML", "CSS"]),
      "coder@talent.test",
    );
  const extrasFill = instance.prepare("UPDATE User SET extras=? WHERE email=? AND (extras IS NULL OR extras='')");
  for (const [email, extras] of Object.entries(DEMO_EXTRAS)) {
    extrasFill.run(stringifyExtras(extras), email);
  }
  ensureCodingQuestions(instance);
}

function now() {
  return new Date().toISOString();
}

function id() {
  return randomUUID();
}

function asBool(value: unknown) {
  return value === 1 || value === true || value === "1";
}

function toBool(value: unknown) {
  return value ? 1 : 0;
}

function toDate(value: unknown) {
  return value ? new Date(String(value)) : null;
}

export type User = {
  id: string;
  email: string;
  passwordHash: string;
  role: string;
  name: string;
  country: string | null;
  phone: string | null;
  phoneVerified: boolean;
  phoneOtpHash: string | null;
  phoneOtpExpires: Date | null;
  bio: string | null;
  createdAt: Date;
  updatedAt: Date;
  linkedinUrl: string | null;
  resumeUrl: string | null;
  avatarUrl: string | null;
  title: string | null;
  hourlyRate: number | null;
  skills: string | null;
  extras: string | null;
  skillTestPassed: boolean;
  talentBadge: boolean;
  connects: number;
  onboardingDone: boolean;
  companyName: string | null;
  companySize: string | null;
  companyIndustry: string | null;
  companyWebsite: string | null;
  companyLocation: string | null;
  stripeCustomerId: string | null;
  paymentConnected: boolean;
};

function mapUser(row: Dict): User {
  return {
    id: String(row.id),
    email: String(row.email),
    passwordHash: String(row.passwordHash),
    role: String(row.role),
    name: String(row.name),
    country: (row.country as string) ?? null,
    phone: (row.phone as string) ?? null,
    phoneVerified: asBool(row.phoneVerified),
    phoneOtpHash: (row.phoneOtpHash as string) ?? null,
    phoneOtpExpires: toDate(row.phoneOtpExpires),
    bio: (row.bio as string) ?? null,
    createdAt: new Date(String(row.createdAt)),
    updatedAt: new Date(String(row.updatedAt)),
    linkedinUrl: (row.linkedinUrl as string) ?? null,
    resumeUrl: (row.resumeUrl as string) ?? null,
    avatarUrl: (row.avatarUrl as string) ?? null,
    title: (row.title as string) ?? null,
    hourlyRate: row.hourlyRate == null || row.hourlyRate === "" ? null : Number(row.hourlyRate),
    skills: (row.skills as string) ?? null,
    extras: (row.extras as string) ?? null,
    skillTestPassed: asBool(row.skillTestPassed),
    talentBadge: asBool(row.talentBadge),
    connects: Number(row.connects ?? 0),
    onboardingDone: asBool(row.onboardingDone),
    companyName: (row.companyName as string) ?? null,
    companySize: (row.companySize as string) ?? null,
    companyIndustry: (row.companyIndustry as string) ?? null,
    companyWebsite: (row.companyWebsite as string) ?? null,
    companyLocation: (row.companyLocation as string) ?? null,
    stripeCustomerId: (row.stripeCustomerId as string) ?? null,
    paymentConnected: asBool(row.paymentConnected),
  };
}

function mapJob(row: Dict) {
  return {
    id: String(row.id),
    title: String(row.title),
    description: String(row.description),
    category: String(row.category),
    skills: String(row.skills),
    budgetMin: row.budgetMin == null ? null : Number(row.budgetMin),
    budgetMax: row.budgetMax == null ? null : Number(row.budgetMax),
    budgetType: String(row.budgetType),
    highBadge: asBool(row.highBadge),
    connectCost: Number(row.connectCost),
    status: String(row.status),
    clientId: String(row.clientId),
    createdAt: new Date(String(row.createdAt)),
  };
}

function mapApplication(row: Dict) {
  return {
    id: String(row.id),
    jobId: String(row.jobId),
    talentId: String(row.talentId),
    coverLetter: String(row.coverLetter),
    connectsUsed: Number(row.connectsUsed),
    status: String(row.status),
    attachmentUrl: (row.attachmentUrl as string) ?? null,
    attachmentName: (row.attachmentName as string) ?? null,
    createdAt: new Date(String(row.createdAt)),
  };
}

function getUserById(userId: string) {
  const row = db().prepare("SELECT * FROM User WHERE id = ?").get(userId) as Dict | undefined;
  return row ? mapUser(row) : null;
}

function applyIncrement(current: number, value: unknown) {
  if (value && typeof value === "object" && "increment" in (value as Dict)) {
    return current + Number((value as Dict).increment);
  }
  if (value && typeof value === "object" && "decrement" in (value as Dict)) {
    return current - Number((value as Dict).decrement);
  }
  return Number(value);
}

function userWhereSql(where: Dict = {}) {
  const clauses: string[] = [];
  const params: unknown[] = [];
  if (where.id) {
    clauses.push("id = ?");
    params.push(where.id);
  }
  if (where.email) {
    clauses.push("email = ?");
    params.push(where.email);
  }
  if (where.role) {
    clauses.push("role = ?");
    params.push(where.role);
  }
  if (where.talentBadge !== undefined) {
    clauses.push("talentBadge = ?");
    params.push(toBool(where.talentBadge));
  }
  if (where.onboardingDone !== undefined) {
    clauses.push("onboardingDone = ?");
    params.push(toBool(where.onboardingDone));
  }
  return { clauses, params };
}

export const prisma = {
  user: {
    async findUnique({ where }: { where: Dict }) {
      if (where.id) return getUserById(String(where.id));
      if (where.email) {
        const row = db().prepare("SELECT * FROM User WHERE email = ?").get(where.email) as Dict | undefined;
        return row ? mapUser(row) : null;
      }
      return null;
    },
    async findMany({ where = {}, orderBy }: { where?: Dict; orderBy?: Dict } = {}) {
      const { clauses, params } = userWhereSql(where);
      const order = orderBy?.createdAt === "desc" ? "createdAt DESC" : orderBy?.name === "asc" ? "name ASC" : "createdAt DESC";
      const extra =
        orderBy?.talentBadge === "desc" ? "talentBadge DESC, name ASC" : order;
      const sql = `SELECT * FROM User ${clauses.length ? `WHERE ${clauses.join(" AND ")}` : ""} ORDER BY ${extra}`;
      return (db().prepare(sql).all(...params) as Dict[]).map(mapUser);
    },
    async count({ where = {} }: { where?: Dict } = {}) {
      const { clauses, params } = userWhereSql(where);
      const row = db()
        .prepare(`SELECT COUNT(*) as c FROM User ${clauses.length ? `WHERE ${clauses.join(" AND ")}` : ""}`)
        .get(...params) as Dict;
      return Number(row.c);
    },
    async create({ data }: { data: Dict }) {
      const userId = id();
      const createdAt = now();
      db()
        .prepare(
          `INSERT INTO User (
            id, email, passwordHash, role, name, country, phone, phoneVerified, bio, createdAt, updatedAt,
            linkedinUrl, resumeUrl, avatarUrl, title, hourlyRate, skills, extras, skillTestPassed, talentBadge, connects, onboardingDone,
            companyName, companySize, companyIndustry, companyWebsite, companyLocation, paymentConnected
          ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        )
        .run(
          userId,
          data.email,
          data.passwordHash,
          data.role,
          data.name,
          data.country ?? null,
          data.phone ?? null,
          toBool(data.phoneVerified),
          data.bio ?? null,
          createdAt,
          createdAt,
          data.linkedinUrl ?? null,
          data.resumeUrl ?? null,
          data.avatarUrl ?? null,
          data.title ?? null,
          data.hourlyRate == null ? null : Number(data.hourlyRate),
          data.skills ?? null,
          data.extras ?? null,
          toBool(data.skillTestPassed),
          toBool(data.talentBadge),
          Number(data.connects ?? 0),
          toBool(data.onboardingDone),
          data.companyName ?? null,
          data.companySize ?? null,
          data.companyIndustry ?? null,
          data.companyWebsite ?? null,
          data.companyLocation ?? null,
          toBool(data.paymentConnected),
        );
      return getUserById(userId)!;
    },
    async update({ where, data }: { where: { id: string }; data: Dict }) {
      const current = getUserById(where.id);
      if (!current) throw new Error("User not found");
      const next = {
        ...current,
        ...data,
        phoneVerified: data.phoneVerified === undefined ? current.phoneVerified : Boolean(data.phoneVerified),
        skillTestPassed: data.skillTestPassed === undefined ? current.skillTestPassed : Boolean(data.skillTestPassed),
        talentBadge: data.talentBadge === undefined ? current.talentBadge : Boolean(data.talentBadge),
        onboardingDone: data.onboardingDone === undefined ? current.onboardingDone : Boolean(data.onboardingDone),
        paymentConnected: data.paymentConnected === undefined ? current.paymentConnected : Boolean(data.paymentConnected),
        connects: data.connects === undefined ? current.connects : applyIncrement(current.connects, data.connects),
        phoneOtpExpires: data.phoneOtpExpires === undefined ? current.phoneOtpExpires : data.phoneOtpExpires,
        updatedAt: new Date(),
      };
      db()
        .prepare(
          `UPDATE User SET
            name=?, country=?, phone=?, phoneVerified=?, phoneOtpHash=?, phoneOtpExpires=?, bio=?, updatedAt=?,
            linkedinUrl=?, resumeUrl=?, avatarUrl=?, title=?, hourlyRate=?, skills=?, extras=?, skillTestPassed=?, talentBadge=?, connects=?, onboardingDone=?,
            companyName=?, companySize=?, companyIndustry=?, companyWebsite=?, companyLocation=?,
            stripeCustomerId=?, paymentConnected=?
          WHERE id=?`,
        )
        .run(
          next.name,
          next.country,
          next.phone,
          toBool(next.phoneVerified),
          next.phoneOtpHash,
          next.phoneOtpExpires ? new Date(next.phoneOtpExpires as Date).toISOString() : null,
          next.bio,
          next.updatedAt.toISOString(),
          next.linkedinUrl,
          next.resumeUrl,
          next.avatarUrl,
          next.title,
          next.hourlyRate == null ? null : Number(next.hourlyRate),
          next.skills,
          next.extras ?? null,
          toBool(next.skillTestPassed),
          toBool(next.talentBadge),
          next.connects,
          toBool(next.onboardingDone),
          next.companyName,
          next.companySize,
          next.companyIndustry,
          next.companyWebsite,
          next.companyLocation,
          next.stripeCustomerId,
          toBool(next.paymentConnected),
          where.id,
        );
      return getUserById(where.id);
    },
    async deleteMany() {
      db().exec("DELETE FROM User");
    },
  },
  job: {
    async findUnique({ where, include }: { where: { id: string }; include?: Dict }) {
      const row = db().prepare("SELECT * FROM Job WHERE id = ?").get(where.id) as Dict | undefined;
      if (!row) return null;
      const job = mapJob(row);
      const client = include?.client ? getUserById(job.clientId) : undefined;
      let applications;
      if (include?.applications) {
        const appRows = db().prepare("SELECT * FROM Application WHERE jobId = ? ORDER BY createdAt DESC").all(job.id) as Dict[];
        applications = appRows.map((app) => ({
          ...mapApplication(app),
          talent: getUserById(String(app.talentId)),
        }));
      }
      return { ...job, client, applications };
    },
    async findMany({
      where = {},
      include,
      orderBy,
      take,
    }: {
      where?: Dict;
      include?: Dict;
      orderBy?: Dict;
      take?: number;
    } = {}) {
      const clauses: string[] = [];
      const params: unknown[] = [];
      if (where.status) {
        const status = where.status as Dict | string;
        if (typeof status === "object" && Array.isArray(status.in)) {
          const list = status.in as string[];
          clauses.push(`status IN (${list.map(() => "?").join(",")})`);
          params.push(...list);
        } else {
          clauses.push("status = ?");
          params.push(status);
        }
      }
      if (where.category) {
        clauses.push("category = ?");
        params.push(where.category);
      }
      if (where.clientId) {
        clauses.push("clientId = ?");
        params.push(where.clientId);
      }
      if (where.OR) {
        const or = where.OR as Dict[];
        const parts = or.map((item) => {
          const key = Object.keys(item)[0];
          const value = (item[key] as Dict).contains;
          params.push(`%${value}%`);
          return `${key} LIKE ?`;
        });
        clauses.push(`(${parts.join(" OR ")})`);
      }
      const order = orderBy?.createdAt === "desc" || !orderBy ? "createdAt DESC" : "createdAt ASC";
      const limit = take ? ` LIMIT ${Number(take)}` : "";
      const rows = db()
        .prepare(`SELECT * FROM Job ${clauses.length ? `WHERE ${clauses.join(" AND ")}` : ""} ORDER BY ${order}${limit}`)
        .all(...params) as Dict[];
      return rows.map((row) => {
        const job = mapJob(row);
        const client = include?.client ? getUserById(job.clientId) : undefined;
        const count = include?._count
          ? Number((db().prepare("SELECT COUNT(*) as c FROM Application WHERE jobId = ?").get(job.id) as Dict).c)
          : undefined;
        return {
          ...job,
          client,
          _count: count === undefined ? undefined : { applications: count },
        };
      });
    },
    async count({ where = {} }: { where?: Dict } = {}) {
      const clauses: string[] = [];
      const params: unknown[] = [];
      if (where.status) {
        const status = where.status as Dict | string;
        if (typeof status === "object" && Array.isArray(status.in)) {
          const list = status.in as string[];
          clauses.push(`status IN (${list.map(() => "?").join(",")})`);
          params.push(...list);
        } else {
          clauses.push("status = ?");
          params.push(status);
        }
      }
      const row = db()
        .prepare(`SELECT COUNT(*) as c FROM Job ${clauses.length ? `WHERE ${clauses.join(" AND ")}` : ""}`)
        .get(...params) as Dict;
      return Number(row.c);
    },
    async create({ data }: { data: Dict }) {
      const jobId = id();
      db()
        .prepare(
          `INSERT INTO Job (id, title, description, category, skills, budgetMin, budgetMax, budgetType, highBadge, connectCost, status, clientId, createdAt)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        )
        .run(
          jobId,
          data.title,
          data.description,
          data.category,
          data.skills,
          data.budgetMin ?? null,
          data.budgetMax ?? null,
          data.budgetType ?? "fixed",
          toBool(data.highBadge),
          Number(data.connectCost ?? 10),
          data.status ?? "OPEN",
          data.clientId,
          data.createdAt ? new Date(data.createdAt as string | Date).toISOString() : now(),
        );
      return this.findUnique({ where: { id: jobId }, include: { client: true } });
    },
    async update({ where, data }: { where: { id: string }; data: Dict }) {
      const current = db().prepare("SELECT * FROM Job WHERE id = ?").get(where.id) as Dict | undefined;
      if (!current) throw new Error("Job not found");
      const status = data.status ?? current.status;
      db().prepare("UPDATE Job SET status = ? WHERE id = ?").run(status, where.id);
      return mapJob({ ...current, status });
    },
    async deleteMany() {
      db().exec("DELETE FROM Job");
    },
  },
  application: {
    async findUnique({ where, include }: { where: Dict; include?: Dict }) {
      let row: Dict | undefined;
      if (where.id) row = db().prepare("SELECT * FROM Application WHERE id = ?").get(where.id) as Dict | undefined;
      if (where.jobId_talentId) {
        const pair = where.jobId_talentId as Dict;
        row = db()
          .prepare("SELECT * FROM Application WHERE jobId = ? AND talentId = ?")
          .get(pair.jobId, pair.talentId) as Dict | undefined;
      }
      if (!row) return null;
      const app = mapApplication(row);
      return {
        ...app,
        job: include?.job ? await prisma.job.findUnique({ where: { id: app.jobId } }) : undefined,
        talent: include?.talent ? getUserById(app.talentId) : undefined,
      };
    },
    async findMany({ where = {}, include, orderBy, take }: { where?: Dict; include?: Dict; orderBy?: Dict; take?: number } = {}) {
      const clauses: string[] = [];
      const params: unknown[] = [];
      if (where.talentId) {
        clauses.push("talentId = ?");
        params.push(where.talentId);
      }
      if (where.job && (where.job as Dict).clientId) {
        clauses.push("jobId IN (SELECT id FROM Job WHERE clientId = ?)");
        params.push((where.job as Dict).clientId);
      }
      const order = orderBy?.createdAt === "desc" || !orderBy ? "createdAt DESC" : "createdAt ASC";
      const limit = take ? `LIMIT ${Number(take)}` : "";
      const rows = db()
        .prepare(`SELECT * FROM Application ${clauses.length ? `WHERE ${clauses.join(" AND ")}` : ""} ORDER BY ${order} ${limit}`)
        .all(...params) as Dict[];
      return Promise.all(
        rows.map(async (row) => {
          const app = mapApplication(row);
          const job = include?.job ? await prisma.job.findUnique({ where: { id: app.jobId }, include: { client: true } }) : undefined;
          const talent = include?.talent ? getUserById(app.talentId) : undefined;
          return { ...app, job, talent };
        }),
      );
    },
    async create({ data }: { data: Dict }) {
      const appId = id();
      db()
        .prepare(
          `INSERT INTO Application (id, jobId, talentId, coverLetter, connectsUsed, status, attachmentUrl, attachmentName, createdAt)
           VALUES (?,?,?,?,?,?,?,?,?)`,
        )
        .run(
          appId,
          data.jobId,
          data.talentId,
          data.coverLetter,
          data.connectsUsed,
          data.status ?? "PENDING",
          data.attachmentUrl ?? null,
          data.attachmentName ?? null,
          data.createdAt ? new Date(data.createdAt as string | Date).toISOString() : now(),
        );
      return mapApplication(db().prepare("SELECT * FROM Application WHERE id = ?").get(appId) as Dict);
    },
    async update({ where, data }: { where: { id: string }; data: Dict }) {
      db().prepare("UPDATE Application SET status = ? WHERE id = ?").run(data.status, where.id);
      return this.findUnique({ where: { id: where.id } });
    },
    async deleteMany() {
      db().exec("DELETE FROM Application");
    },
  },
  conversation: {
    async findUnique({ where, include }: { where: Dict; include?: Dict }) {
      let row: Dict | undefined;
      if (where.id) row = db().prepare("SELECT * FROM Conversation WHERE id = ?").get(where.id) as Dict | undefined;
      if (where.userAId_userBId) {
        const pair = where.userAId_userBId as Dict;
        row = db()
          .prepare("SELECT * FROM Conversation WHERE userAId = ? AND userBId = ?")
          .get(pair.userAId, pair.userBId) as Dict | undefined;
      }
      if (!row) return null;
      const convo = {
        id: String(row.id),
        userAId: String(row.userAId),
        userBId: String(row.userBId),
        createdAt: new Date(String(row.createdAt)),
        updatedAt: new Date(String(row.updatedAt)),
      };
      const userA = include?.userA ? getUserById(convo.userAId) : undefined;
      const userB = include?.userB ? getUserById(convo.userBId) : undefined;
      let messages;
      if (include?.messages) {
        const take = (include.messages as Dict).take as number | undefined;
        const order = (include.messages as Dict).orderBy as Dict | undefined;
        const dir = order?.createdAt === "asc" ? "ASC" : "DESC";
        const sql = `SELECT * FROM Message WHERE conversationId = ? ORDER BY createdAt ${dir} ${take ? `LIMIT ${take}` : ""}`;
        messages = (db().prepare(sql).all(convo.id) as Dict[]).map((m) => ({
          id: String(m.id),
          conversationId: String(m.conversationId),
          senderId: String(m.senderId),
          content: String(m.content),
          createdAt: new Date(String(m.createdAt)),
        }));
      }
      return { ...convo, userA, userB, messages };
    },
    async findMany({ where, include, orderBy }: { where?: Dict; include?: Dict; orderBy?: Dict } = {}) {
      const or = (where?.OR as Dict[]) || [];
      const rows = db()
        .prepare(
          `SELECT * FROM Conversation ${or.length ? "WHERE userAId = ? OR userBId = ?" : ""} ORDER BY updatedAt DESC`,
        )
        .all(...(or.length ? [or[0].userAId || or[1].userAId, or[0].userBId || or[1].userBId] : [])) as Dict[];
      const userId = or[0]?.userAId || or[0]?.userBId;
      const filtered = userId
        ? (db()
            .prepare("SELECT * FROM Conversation WHERE userAId = ? OR userBId = ? ORDER BY updatedAt DESC")
            .all(userId, userId) as Dict[])
        : rows;
      void orderBy;
      return Promise.all(filtered.map((row) => this.findUnique({ where: { id: row.id }, include })));
    },
    async create({ data }: { data: Dict }) {
      const convoId = id();
      const createdAt = now();
      db()
        .prepare("INSERT INTO Conversation (id, userAId, userBId, createdAt, updatedAt) VALUES (?,?,?,?,?)")
        .run(convoId, data.userAId, data.userBId, createdAt, createdAt);
      return this.findUnique({ where: { id: convoId } });
    },
    async update({ where, data }: { where: { id: string }; data: Dict }) {
      db()
        .prepare("UPDATE Conversation SET updatedAt = ? WHERE id = ?")
        .run(data.updatedAt ? new Date(data.updatedAt as Date).toISOString() : now(), where.id);
      return this.findUnique({ where });
    },
    async deleteMany() {
      db().exec("DELETE FROM Conversation");
    },
  },
  message: {
    async create({ data }: { data: Dict }) {
      const messageId = id();
      db()
        .prepare("INSERT INTO Message (id, conversationId, senderId, content, createdAt) VALUES (?,?,?,?,?)")
        .run(messageId, data.conversationId, data.senderId, data.content, now());
      return { id: messageId, ...data, createdAt: new Date() };
    },
    async deleteMany() {
      db().exec("DELETE FROM Message");
    },
  },
  skillQuestion: {
    async findMany({ where }: { where?: Dict } = {}) {
      const ids = where?.id && (where.id as Dict).in ? ((where.id as Dict).in as string[]) : null;
      const rows = ids
        ? (db()
            .prepare(`SELECT * FROM SkillQuestion WHERE id IN (${ids.map(() => "?").join(",")})`)
            .all(...ids) as Dict[])
        : (db().prepare("SELECT * FROM SkillQuestion").all() as Dict[]);
      return rows.map((row) => ({
        id: String(row.id),
        prompt: String(row.prompt),
        options: String(row.options),
        correctIndex: Number(row.correctIndex),
        category: String(row.category),
        kind: String(row.kind ?? "mcq"),
        starterCode: (row.starterCode as string) ?? null,
        functionName: (row.functionName as string) ?? null,
        tests: (row.tests as string) ?? null,
      }));
    },
    async createMany({ data }: { data: Dict[] }) {
      const stmt = db().prepare(
        "INSERT INTO SkillQuestion (id, prompt, options, correctIndex, category, kind, starterCode, functionName, tests) VALUES (?,?,?,?,?,?,?,?,?)",
      );
      for (const item of data) {
        stmt.run(
          id(),
          item.prompt,
          item.options,
          item.correctIndex,
          item.category,
          item.kind ?? "mcq",
          item.starterCode ?? null,
          item.functionName ?? null,
          item.tests ?? null,
        );
      }
    },
    async deleteMany() {
      db().exec("DELETE FROM SkillQuestion");
    },
  },
  skillAttempt: {
    async findUnique({ where }: { where: { id: string } }) {
      const row = db().prepare("SELECT * FROM SkillAttempt WHERE id = ?").get(where.id) as Dict | undefined;
      if (!row) return null;
      return {
        id: String(row.id),
        talentId: String(row.talentId),
        startedAt: new Date(String(row.startedAt)),
        completedAt: toDate(row.completedAt),
        score: row.score == null ? null : Number(row.score),
        passed: asBool(row.passed),
        cameraEnabled: asBool(row.cameraEnabled),
        answers: (row.answers as string) ?? null,
      };
    },
    async findMany({ include, orderBy, take }: { include?: Dict; orderBy?: Dict; take?: number } = {}) {
      void orderBy;
      const rows = db()
        .prepare(`SELECT * FROM SkillAttempt ORDER BY startedAt DESC ${take ? `LIMIT ${Number(take)}` : ""}`)
        .all() as Dict[];
      return rows.map((row) => ({
        id: String(row.id),
        talentId: String(row.talentId),
        startedAt: new Date(String(row.startedAt)),
        completedAt: toDate(row.completedAt),
        score: row.score == null ? null : Number(row.score),
        passed: asBool(row.passed),
        cameraEnabled: asBool(row.cameraEnabled),
        answers: (row.answers as string) ?? null,
        talent: include?.talent ? getUserById(String(row.talentId)) : undefined,
      }));
    },
    async create({ data }: { data: Dict }) {
      const attemptId = id();
      db()
        .prepare(
          `INSERT INTO SkillAttempt (id, talentId, startedAt, completedAt, score, passed, cameraEnabled, answers)
           VALUES (?,?,?,?,?,?,?,?)`,
        )
        .run(
          attemptId,
          data.talentId,
          data.startedAt ? new Date(data.startedAt as Date).toISOString() : now(),
          data.completedAt ? new Date(data.completedAt as Date).toISOString() : null,
          data.score ?? null,
          toBool(data.passed),
          toBool(data.cameraEnabled),
          data.answers ?? null,
        );
      return this.findUnique({ where: { id: attemptId } });
    },
    async update({ where, data }: { where: { id: string }; data: Dict }) {
      db()
        .prepare("UPDATE SkillAttempt SET completedAt=?, score=?, passed=?, cameraEnabled=?, answers=? WHERE id=?")
        .run(
          data.completedAt ? new Date(data.completedAt as Date).toISOString() : null,
          data.score ?? null,
          toBool(data.passed),
          toBool(data.cameraEnabled),
          data.answers ?? null,
          where.id,
        );
      return this.findUnique({ where });
    },
    async deleteMany() {
      db().exec("DELETE FROM SkillAttempt");
    },
  },
  connectPurchase: {
    async findUnique({ where }: { where: Dict }) {
      const row = where.stripeSessionId
        ? (db().prepare("SELECT * FROM ConnectPurchase WHERE stripeSessionId = ?").get(where.stripeSessionId) as Dict | undefined)
        : undefined;
      if (!row) return null;
      return {
        id: String(row.id),
        talentId: String(row.talentId),
        connects: Number(row.connects),
        amountCents: Number(row.amountCents),
        stripeSessionId: (row.stripeSessionId as string) ?? null,
        status: String(row.status),
        createdAt: new Date(String(row.createdAt)),
      };
    },
    async findMany({ where, orderBy, take }: { where?: Dict; orderBy?: Dict; take?: number } = {}) {
      void orderBy;
      const rows = db()
        .prepare(
          `SELECT * FROM ConnectPurchase ${where?.talentId ? "WHERE talentId = ?" : ""} ORDER BY createdAt DESC ${take ? `LIMIT ${Number(take)}` : ""}`,
        )
        .all(...(where?.talentId ? [where.talentId] : [])) as Dict[];
      return rows.map((row) => ({
        id: String(row.id),
        talentId: String(row.talentId),
        connects: Number(row.connects),
        amountCents: Number(row.amountCents),
        stripeSessionId: (row.stripeSessionId as string) ?? null,
        status: String(row.status),
        createdAt: new Date(String(row.createdAt)),
      }));
    },
    async create({ data }: { data: Dict }) {
      const purchaseId = id();
      db()
        .prepare(
          `INSERT INTO ConnectPurchase (id, talentId, connects, amountCents, stripeSessionId, status, createdAt)
           VALUES (?,?,?,?,?,?,?)`,
        )
        .run(
          purchaseId,
          data.talentId,
          data.connects,
          data.amountCents,
          data.stripeSessionId ?? null,
          data.status ?? "completed",
          now(),
        );
      return { id: purchaseId, ...data, createdAt: new Date() };
    },
    async update({ where, data }: { where: { id: string }; data: Dict }) {
      db().prepare("UPDATE ConnectPurchase SET status = ? WHERE id = ?").run(data.status, where.id);
      return { id: where.id, ...data };
    },
    async deleteMany() {
      db().exec("DELETE FROM ConnectPurchase");
    },
  },
  async $transaction<T>(ops: Promise<T>[]) {
    return Promise.all(ops);
  },
  async $disconnect() {
    return;
  },
};

export { db as getSqlite };
