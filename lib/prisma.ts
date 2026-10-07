import { randomUUID } from "crypto";
import { DEMO_EXTRAS, stringifyExtras } from "./profile-extras";
import { CODING_QUESTIONS, toCodeQuestionRow } from "./coding-questions";
import { jobDurationFromTitle, jobTypeFromTitle } from "./constants";
import { ADMIN_EMAIL, ADMIN_ID, ADMIN_NAME, adminPassword } from "./admin";
import { hashSync } from "bcryptjs";
import { isVercelProduction } from "./paths";
import { marketplaceJobs } from "../prisma/marketplace-data";
import { getSql, usesRemoteDatabase, type Dict, type SqlDatabase } from "./sql";

const globalForDb = globalThis as unknown as {
  hirelineSeeded?: boolean;
  hirelineMigrated?: boolean;
  hirelineSeedPromise?: Promise<void>;
};

async function db() {
  const instance = await getSql();
  if (!globalForDb.hirelineMigrated) {
    await migrate(instance);
    globalForDb.hirelineMigrated = true;
  }
  return instance;
}

async function qget(sql: string, ...params: unknown[]) {
  return (await db()).prepare(sql).get(...params);
}

async function qall(sql: string, ...params: unknown[]) {
  return (await db()).prepare(sql).all(...params);
}

async function qrun(sql: string, ...params: unknown[]) {
  await (await db()).prepare(sql).run(...params);
}

async function qexec(sql: string) {
  await (await db()).exec(sql);
}

async function userCount() {
  const row = await qget("SELECT COUNT(*) AS c FROM User");
  return Number(row?.c ?? 0);
}

async function ensureDemoSeed() {
  if (globalForDb.hirelineSeeded) return;
  if (isVercelProduction() || usesRemoteDatabase()) {
    globalForDb.hirelineSeeded = true;
    return;
  }
  if ((await userCount()) > 0) {
    globalForDb.hirelineSeeded = true;
    return;
  }
  if (globalForDb.hirelineSeedPromise) {
    await globalForDb.hirelineSeedPromise;
    return;
  }
  globalForDb.hirelineSeedPromise = (async () => {
    try {
      const { seedDemoData } = await import("./seed-demo");
      await seedDemoData();
      globalForDb.hirelineSeeded = true;
    } catch (error) {
      console.error("Demo seed failed", error);
      globalForDb.hirelineSeedPromise = undefined;
    }
  })();
  await globalForDb.hirelineSeedPromise;
}

async function ensureCodingQuestions(instance: SqlDatabase) {
  const row = await instance.prepare("SELECT COUNT(*) AS c FROM SkillQuestion WHERE kind = 'code'").get();
  if (row && Number(row.c) > 0) return;

  const stmt = instance.prepare(
    "INSERT INTO SkillQuestion (id, prompt, options, correctIndex, category, kind, starterCode, functionName, tests) VALUES (?,?,?,?,?,?,?,?,?)",
  );
  for (const item of CODING_QUESTIONS.map(toCodeQuestionRow)) {
    await stmt.run(
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

async function migrate(instance: SqlDatabase) {
  await instance.exec(`
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
      emailVerified INTEGER NOT NULL DEFAULT 0,
      emailOtpHash TEXT,
      emailOtpExpires TEXT,
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
      paymentConnected INTEGER NOT NULL DEFAULT 0,
      introVideoUrl TEXT,
      introVideoMime TEXT,
      introVideoSeconds INTEGER,
      introVideoAt TEXT
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
      jobType TEXT NOT NULL DEFAULT 'Full-time',
      duration TEXT NOT NULL DEFAULT '1–3 months',
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
      cameraOn INTEGER NOT NULL DEFAULT 0,
      lastHeartbeat TEXT,
      cameraFrame TEXT,
      questionIndex INTEGER NOT NULL DEFAULT 0,
      stackName TEXT,
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
  async function addColumn(sql: string) {
    try {
      await instance.exec(sql);
    } catch {
      // column already exists
    }
  }
  await addColumn("ALTER TABLE User ADD COLUMN country TEXT");
  for (const column of [
    "introVideoUrl TEXT",
    "introVideoMime TEXT",
    "introVideoSeconds INTEGER",
    "introVideoAt TEXT",
  ]) {
    await addColumn(`ALTER TABLE User ADD COLUMN ${column}`);
  }
  await instance.exec(`
    CREATE TABLE IF NOT EXISTS IntroVideoChunk (
      userId TEXT NOT NULL,
      seq INTEGER NOT NULL,
      data TEXT NOT NULL,
      PRIMARY KEY (userId, seq)
    );
  `);
  for (const column of ["jobType TEXT NOT NULL DEFAULT 'Full-time'", "duration TEXT NOT NULL DEFAULT '1–3 months'"]) {
    await addColumn(`ALTER TABLE Job ADD COLUMN ${column}`);
  }
  if (instance.kind === "local") {
    const jobMeta = instance.prepare("UPDATE Job SET jobType = ?, duration = ? WHERE title = ?");
    for (const item of marketplaceJobs) {
      await jobMeta.run(jobTypeFromTitle(item.title), jobDurationFromTitle(item.title), item.title);
    }
  }
  await addColumn("ALTER TABLE Application ADD COLUMN attachmentUrl TEXT");
  await addColumn("ALTER TABLE Application ADD COLUMN attachmentName TEXT");
  await addColumn("ALTER TABLE SkillQuestion ADD COLUMN kind TEXT NOT NULL DEFAULT 'mcq'");
  await addColumn("ALTER TABLE SkillQuestion ADD COLUMN starterCode TEXT");
  await addColumn("ALTER TABLE SkillQuestion ADD COLUMN functionName TEXT");
  await addColumn("ALTER TABLE SkillQuestion ADD COLUMN tests TEXT");
  await ensureSkillAttemptLiveColumns(instance);
  for (const column of [
    "avatarUrl TEXT",
    "title TEXT",
    "hourlyRate INTEGER",
    "skills TEXT",
    "extras TEXT",
    "emailVerified INTEGER NOT NULL DEFAULT 0",
    "emailOtpHash TEXT",
    "emailOtpExpires TEXT",
  ]) {
    await addColumn(`ALTER TABLE User ADD COLUMN ${column}`);
  }
  try {
    await instance.exec("UPDATE User SET emailVerified = 1 WHERE onboardingDone = 1");
  } catch {
    // column missing on a brand-new empty file
  }
  if (instance.kind === "local") {
    const avatarFill = instance.prepare(
      `UPDATE User SET avatarUrl=?, title=?, hourlyRate=?, skills=? WHERE email=? AND (avatarUrl IS NULL OR avatarUrl='')`,
    );
    await avatarFill.run(
      "/avatars/maya.jpg",
      "Product Designer & Front-End Engineer",
      75,
      JSON.stringify(["React", "Figma", "TypeScript", "UI design"]),
      "maya@talent.test",
    );
    await avatarFill.run(
      "/avatars/diego.jpg",
      "Full-Stack TypeScript Developer",
      85,
      JSON.stringify(["Next.js", "Node.js", "PostgreSQL", "Payments"]),
      "diego@talent.test",
    );
    await avatarFill.run(
      "/avatars/coder.jpg",
      "JavaScript Developer",
      40,
      JSON.stringify(["JavaScript", "Algorithms", "HTML", "CSS"]),
      "coder@talent.test",
    );
    const extrasFill = instance.prepare("UPDATE User SET extras=? WHERE email=? AND (extras IS NULL OR extras='')");
    for (const [email, extras] of Object.entries(DEMO_EXTRAS)) {
      await extrasFill.run(stringifyExtras(extras), email);
    }
  }
  await ensureCodingQuestions(instance);
  await ensureAdminUser(instance);
}

async function ensureSkillAttemptLiveColumns(instance: SqlDatabase) {
  for (const column of [
    "cameraOn INTEGER NOT NULL DEFAULT 0",
    "lastHeartbeat TEXT",
    "cameraFrame TEXT",
    "questionIndex INTEGER NOT NULL DEFAULT 0",
    "stackName TEXT",
  ]) {
    try {
      await instance.exec(`ALTER TABLE SkillAttempt ADD COLUMN ${column}`);
    } catch {
      // column already exists
    }
  }
}

async function ensureAdminUser(instance: SqlDatabase) {
  const createdAt = now();
  await instance.prepare("DELETE FROM User WHERE role = 'ADMIN' AND lower(email) != ?").run(ADMIN_EMAIL);
  const password = adminPassword();
  const existing = await instance.prepare("SELECT id FROM User WHERE lower(email) = ?").get(ADMIN_EMAIL);
  if (!password) {
    if (existing) {
      await instance
        .prepare(`UPDATE User SET role='ADMIN', name=?, emailVerified=1, onboardingDone=1, phoneVerified=1, updatedAt=? WHERE id=?`)
        .run(ADMIN_NAME, createdAt, existing.id);
    }
    return;
  }
  const passwordHash = hashSync(password, 10);
  if (existing) {
    await instance
      .prepare(
        `UPDATE User SET passwordHash=?, role='ADMIN', name=?, emailVerified=1, onboardingDone=1, phoneVerified=1, updatedAt=? WHERE id=?`,
      )
      .run(passwordHash, ADMIN_NAME, createdAt, existing.id);
    return;
  }
  await instance
    .prepare(
      `INSERT INTO User (
        id, email, passwordHash, role, name, phoneVerified, emailVerified, onboardingDone, createdAt, updatedAt, connects
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    )
    .run(ADMIN_ID, ADMIN_EMAIL, passwordHash, "ADMIN", ADMIN_NAME, 1, 1, 1, createdAt, createdAt, 0);
}

function mapSkillAttempt(row: Dict) {
  return {
    id: String(row.id),
    talentId: String(row.talentId),
    startedAt: new Date(String(row.startedAt)),
    completedAt: toDate(row.completedAt),
    score: row.score == null ? null : Number(row.score),
    passed: asBool(row.passed),
    cameraEnabled: asBool(row.cameraEnabled),
    cameraOn: asBool(row.cameraOn),
    lastHeartbeat: toDate(row.lastHeartbeat),
    cameraFrame: (row.cameraFrame as string) ?? null,
    questionIndex: row.questionIndex == null ? 0 : Number(row.questionIndex),
    stackName: (row.stackName as string) ?? null,
    answers: (row.answers as string) ?? null,
  };
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
  emailVerified: boolean;
  emailOtpHash: string | null;
  emailOtpExpires: Date | null;
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
  introVideoUrl: string | null;
  introVideoMime: string | null;
  introVideoSeconds: number | null;
  introVideoAt: Date | null;
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
    emailVerified: asBool(row.emailVerified),
    emailOtpHash: (row.emailOtpHash as string) ?? null,
    emailOtpExpires: toDate(row.emailOtpExpires),
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
    introVideoUrl: (row.introVideoUrl as string) ?? null,
    introVideoMime: (row.introVideoMime as string) ?? null,
    introVideoSeconds: row.introVideoSeconds == null || row.introVideoSeconds === "" ? null : Number(row.introVideoSeconds),
    introVideoAt: toDate(row.introVideoAt),
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
    jobType: String(row.jobType || jobTypeFromTitle(String(row.title))),
    duration: String(row.duration || jobDurationFromTitle(String(row.title))),
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

async function getUserById(userId: string) {
  const row = await qget("SELECT * FROM User WHERE id = ?", userId);
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
      await ensureDemoSeed();
      if (where.id) return await getUserById(String(where.id));
      if (where.email) {
        const row = await qget("SELECT * FROM User WHERE email = ?", where.email) as Dict | undefined;
        return row ? mapUser(row) : null;
      }
      return null;
    },
    async findMany({ where = {}, orderBy }: { where?: Dict; orderBy?: Dict } = {}) {
      await ensureDemoSeed();
      const { clauses, params } = userWhereSql(where);
      const order = orderBy?.createdAt === "desc" ? "createdAt DESC" : orderBy?.name === "asc" ? "name ASC" : "createdAt DESC";
      const extra =
        orderBy?.talentBadge === "desc" ? "talentBadge DESC, name ASC" : order;
      const sql = `SELECT * FROM User ${clauses.length ? `WHERE ${clauses.join(" AND ")}` : ""} ORDER BY ${extra}`;
      return (await qall(sql, ...params) as Dict[]).map(mapUser);
    },
    async count({ where = {} }: { where?: Dict } = {}) {
      await ensureDemoSeed();
      const { clauses, params } = userWhereSql(where);
      const row = await qget(`SELECT COUNT(*) as c FROM User ${clauses.length ? `WHERE ${clauses.join(" AND ")}` : ""}`, ...params) as Dict;
      return Number(row.c);
    },
    async create({ data }: { data: Dict }) {
      const userId = String(data.id ?? id());
      const createdAt = now();
      await qrun(`INSERT INTO User (
            id, email, passwordHash, role, name, country, phone, phoneVerified, emailVerified, bio, createdAt, updatedAt,
            linkedinUrl, resumeUrl, avatarUrl, title, hourlyRate, skills, extras, skillTestPassed, talentBadge, connects, onboardingDone,
            companyName, companySize, companyIndustry, companyWebsite, companyLocation, paymentConnected
          ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, userId,
          data.email,
          data.passwordHash,
          data.role,
          data.name,
          data.country ?? null,
          data.phone ?? null,
          toBool(data.phoneVerified),
          data.emailVerified === undefined ? toBool(data.onboardingDone) : toBool(data.emailVerified),
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
          toBool(data.paymentConnected),);
      return (await getUserById(userId))!;
    },
    async update({ where, data }: { where: { id: string }; data: Dict }) {
      const current = await getUserById(where.id);
      if (!current) throw new Error("User not found");
      const patch: Dict = {};
      for (const [key, value] of Object.entries(data)) {
        if (value !== undefined) patch[key] = value;
      }
      const next = {
        ...current,
        ...patch,
        phoneVerified: data.phoneVerified === undefined ? current.phoneVerified : Boolean(data.phoneVerified),
        emailVerified: data.emailVerified === undefined ? current.emailVerified : Boolean(data.emailVerified),
        skillTestPassed: data.skillTestPassed === undefined ? current.skillTestPassed : Boolean(data.skillTestPassed),
        talentBadge: data.talentBadge === undefined ? current.talentBadge : Boolean(data.talentBadge),
        onboardingDone: data.onboardingDone === undefined ? current.onboardingDone : Boolean(data.onboardingDone),
        paymentConnected: data.paymentConnected === undefined ? current.paymentConnected : Boolean(data.paymentConnected),
        connects: data.connects === undefined ? current.connects : applyIncrement(current.connects, data.connects),
        phoneOtpExpires: data.phoneOtpExpires === undefined ? current.phoneOtpExpires : data.phoneOtpExpires,
        emailOtpExpires: data.emailOtpExpires === undefined ? current.emailOtpExpires : data.emailOtpExpires,
        updatedAt: new Date(),
      };
      await qrun(`UPDATE User SET
            name=?, country=?, phone=?, phoneVerified=?, phoneOtpHash=?, phoneOtpExpires=?,
            emailVerified=?, emailOtpHash=?, emailOtpExpires=?, bio=?, updatedAt=?,
            linkedinUrl=?, resumeUrl=?, avatarUrl=?, title=?, hourlyRate=?, skills=?, extras=?, skillTestPassed=?, talentBadge=?, connects=?, onboardingDone=?,
            companyName=?, companySize=?, companyIndustry=?, companyWebsite=?, companyLocation=?,
            stripeCustomerId=?, paymentConnected=?, introVideoUrl=?, introVideoMime=?, introVideoSeconds=?, introVideoAt=?
          WHERE id=?`, next.name,
          next.country,
          next.phone,
          toBool(next.phoneVerified),
          next.phoneOtpHash,
          next.phoneOtpExpires ? new Date(next.phoneOtpExpires as Date).toISOString() : null,
          toBool(next.emailVerified),
          next.emailOtpHash,
          next.emailOtpExpires ? new Date(next.emailOtpExpires as Date).toISOString() : null,
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
          next.introVideoUrl ?? null,
          next.introVideoMime ?? null,
          next.introVideoSeconds == null ? null : Number(next.introVideoSeconds),
          next.introVideoAt ? new Date(next.introVideoAt as Date).toISOString() : null,
          where.id,);
      return await getUserById(where.id);
    },
    async deleteMany() {
      await qexec("DELETE FROM User");
    },
  },
  job: {
    async findUnique({ where, include }: { where: { id: string }; include?: Dict }) {
      const row = await qget("SELECT * FROM Job WHERE id = ?", where.id) as Dict | undefined;
      if (!row) return null;
      const job = mapJob(row);
      const client = include?.client ? await getUserById(job.clientId) : undefined;
      let applications;
      if (include?.applications) {
        const appRows = await qall("SELECT * FROM Application WHERE jobId = ? ORDER BY createdAt DESC", job.id) as Dict[];
        applications = await Promise.all(
          appRows.map(async (app) => ({
            ...mapApplication(app),
            talent: await getUserById(String(app.talentId)),
          })),
        );
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
      await ensureDemoSeed();
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
      const rows = await qall(`SELECT * FROM Job ${clauses.length ? `WHERE ${clauses.join(" AND ")}` : ""} ORDER BY ${order}${limit}`, ...params) as Dict[];
      return Promise.all(
        rows.map(async (row) => {
        const job = mapJob(row);
        const client = include?.client ? await getUserById(job.clientId) : undefined;
        const count = include?._count
          ? Number((await qget("SELECT COUNT(*) as c FROM Application WHERE jobId = ?", job.id) as Dict).c)
          : undefined;
        return {
          ...job,
          client,
          _count: count === undefined ? undefined : { applications: count },
        };
      }),
      );
    },
    async count({ where = {} }: { where?: Dict } = {}) {
      await ensureDemoSeed();
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
      const row = await qget(`SELECT COUNT(*) as c FROM Job ${clauses.length ? `WHERE ${clauses.join(" AND ")}` : ""}`, ...params) as Dict;
      return Number(row.c);
    },
    async create({ data }: { data: Dict }) {
      const jobId = String(data.id ?? id());
      await qrun(`INSERT INTO Job (id, title, description, category, skills, budgetMin, budgetMax, budgetType, jobType, duration, highBadge, connectCost, status, clientId, createdAt)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, jobId,
          data.title,
          data.description,
          data.category,
          data.skills,
          data.budgetMin ?? null,
          data.budgetMax ?? null,
          data.budgetType ?? "fixed",
          data.jobType ?? jobTypeFromTitle(String(data.title ?? "")),
          data.duration ?? jobDurationFromTitle(String(data.title ?? "")),
          toBool(data.highBadge),
          Number(data.connectCost ?? 10),
          data.status ?? "OPEN",
          data.clientId,
          data.createdAt ? new Date(data.createdAt as string | Date).toISOString() : now(),);
      return this.findUnique({ where: { id: jobId }, include: { client: true } });
    },
    async update({ where, data }: { where: { id: string }; data: Dict }) {
      const current = await qget("SELECT * FROM Job WHERE id = ?", where.id) as Dict | undefined;
      if (!current) throw new Error("Job not found");
      const status = data.status ?? current.status;
      await qrun("UPDATE Job SET status = ? WHERE id = ?", status, where.id);
      return mapJob({ ...current, status });
    },
    async deleteMany() {
      await qexec("DELETE FROM Job");
    },
  },
  application: {
    async findFirst({ where = {}, select }: { where?: Dict; select?: Dict } = {}) {
      const clauses: string[] = [];
      const params: unknown[] = [];
      if (where.status) {
        clauses.push("status = ?");
        params.push(where.status);
      }
      if (where.talentId) {
        clauses.push("talentId = ?");
        params.push(where.talentId);
      }
      if (where.jobId) {
        clauses.push("jobId = ?");
        params.push(where.jobId);
      }
      if (where.OR) {
        const orParts = (where.OR as Dict[]).map((item) => {
          const parts: string[] = [];
          if (item.talentId) {
            parts.push("talentId = ?");
            params.push(item.talentId);
          }
          if (item.job && (item.job as Dict).clientId) {
            parts.push("jobId IN (SELECT id FROM Job WHERE clientId = ?)");
            params.push((item.job as Dict).clientId);
          }
          return `(${parts.join(" AND ")})`;
        });
        clauses.push(`(${orParts.join(" OR ")})`);
      }
      const row = await qget(`SELECT * FROM Application ${clauses.length ? `WHERE ${clauses.join(" AND ")}` : ""} LIMIT 1`, ...params) as Dict | undefined;
      if (!row) return null;
      const app = mapApplication(row);
      if (select) {
        const picked: Dict = {};
        for (const key of Object.keys(select)) {
          if (select[key]) picked[key] = (app as Dict)[key];
        }
        return picked;
      }
      return app;
    },
    async findUnique({ where, include }: { where: Dict; include?: Dict }) {
      let row: Dict | undefined;
      if (where.id) row = await qget("SELECT * FROM Application WHERE id = ?", where.id) as Dict | undefined;
      if (where.jobId_talentId) {
        const pair = where.jobId_talentId as Dict;
        row = await qget("SELECT * FROM Application WHERE jobId = ? AND talentId = ?", pair.jobId, pair.talentId) as Dict | undefined;
      }
      if (!row) return null;
      const app = mapApplication(row);
      return {
        ...app,
        job: include?.job ? await prisma.job.findUnique({ where: { id: app.jobId } }) : undefined,
        talent: include?.talent ? await getUserById(app.talentId) : undefined,
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
      const rows = await qall(`SELECT * FROM Application ${clauses.length ? `WHERE ${clauses.join(" AND ")}` : ""} ORDER BY ${order} ${limit}`, ...params) as Dict[];
      return Promise.all(
        rows.map(async (row) => {
          const app = mapApplication(row);
          const job = include?.job ? await prisma.job.findUnique({ where: { id: app.jobId }, include: { client: true } }) : undefined;
          const talent = include?.talent ? await getUserById(app.talentId) : undefined;
          return { ...app, job, talent };
        }),
      );
    },
    async create({ data }: { data: Dict }) {
      const appId = id();
      await qrun(`INSERT INTO Application (id, jobId, talentId, coverLetter, connectsUsed, status, attachmentUrl, attachmentName, createdAt)
           VALUES (?,?,?,?,?,?,?,?,?)`, appId,
          data.jobId,
          data.talentId,
          data.coverLetter,
          data.connectsUsed,
          data.status ?? "PENDING",
          data.attachmentUrl ?? null,
          data.attachmentName ?? null,
          data.createdAt ? new Date(data.createdAt as string | Date).toISOString() : now(),);
      return mapApplication(await qget("SELECT * FROM Application WHERE id = ?", appId) as Dict);
    },
    async update({ where, data }: { where: { id: string }; data: Dict }) {
      await qrun("UPDATE Application SET status = ? WHERE id = ?", data.status, where.id);
      return this.findUnique({ where: { id: where.id } });
    },
    async deleteMany() {
      await qexec("DELETE FROM Application");
    },
  },
  conversation: {
    async findUnique({ where, include }: { where: Dict; include?: Dict }) {
      let row: Dict | undefined;
      if (where.id) row = await qget("SELECT * FROM Conversation WHERE id = ?", where.id) as Dict | undefined;
      if (where.userAId_userBId) {
        const pair = where.userAId_userBId as Dict;
        row = await qget("SELECT * FROM Conversation WHERE userAId = ? AND userBId = ?", pair.userAId, pair.userBId) as Dict | undefined;
      }
      if (!row) return null;
      const convo = {
        id: String(row.id),
        userAId: String(row.userAId),
        userBId: String(row.userBId),
        createdAt: new Date(String(row.createdAt)),
        updatedAt: new Date(String(row.updatedAt)),
      };
      const userA = include?.userA ? await getUserById(convo.userAId) : undefined;
      const userB = include?.userB ? await getUserById(convo.userBId) : undefined;
      let messages;
      if (include?.messages) {
        const take = (include.messages as Dict).take as number | undefined;
        const order = (include.messages as Dict).orderBy as Dict | undefined;
        const dir = order?.createdAt === "asc" ? "ASC" : "DESC";
        const sql = `SELECT * FROM Message WHERE conversationId = ? ORDER BY createdAt ${dir} ${take ? `LIMIT ${take}` : ""}`;
        messages = (await qall(sql, convo.id) as Dict[]).map((m) => ({
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
      const rows = await qall(`SELECT * FROM Conversation ${or.length ? "WHERE userAId = ? OR userBId = ?" : ""} ORDER BY updatedAt DESC`, ...(or.length ? [or[0].userAId || or[1].userAId, or[0].userBId || or[1].userBId] : [])) as Dict[];
      const userId = or[0]?.userAId || or[0]?.userBId;
      const filtered = userId
        ? (await qall("SELECT * FROM Conversation WHERE userAId = ? OR userBId = ? ORDER BY updatedAt DESC", userId, userId) as Dict[])
        : rows;
      void orderBy;
      return Promise.all(filtered.map((row) => this.findUnique({ where: { id: row.id }, include })));
    },
    async create({ data }: { data: Dict }) {
      const convoId = id();
      const createdAt = now();
      await qrun("INSERT INTO Conversation (id, userAId, userBId, createdAt, updatedAt) VALUES (?,?,?,?,?)", convoId, data.userAId, data.userBId, createdAt, createdAt);
      return this.findUnique({ where: { id: convoId } });
    },
    async update({ where, data }: { where: { id: string }; data: Dict }) {
      await qrun("UPDATE Conversation SET updatedAt = ? WHERE id = ?", data.updatedAt ? new Date(data.updatedAt as Date).toISOString() : now(), where.id);
      return this.findUnique({ where });
    },
    async deleteMany() {
      await qexec("DELETE FROM Conversation");
    },
  },
  message: {
    async create({ data }: { data: Dict }) {
      const messageId = id();
      await qrun("INSERT INTO Message (id, conversationId, senderId, content, createdAt) VALUES (?,?,?,?,?)", messageId, data.conversationId, data.senderId, data.content, now());
      return { id: messageId, ...data, createdAt: new Date() };
    },
    async deleteMany() {
      await qexec("DELETE FROM Message");
    },
  },
  skillQuestion: {
    async findMany({ where }: { where?: Dict } = {}) {
      const ids = where?.id && (where.id as Dict).in ? ((where.id as Dict).in as string[]) : null;
      const rows = ids
        ? (await qall(`SELECT * FROM SkillQuestion WHERE id IN (${ids.map(() => "?").join(",")})`, ...ids) as Dict[])
        : (await qall("SELECT * FROM SkillQuestion") as Dict[]);
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
      const stmt = (await db()).prepare(
        "INSERT INTO SkillQuestion (id, prompt, options, correctIndex, category, kind, starterCode, functionName, tests) VALUES (?,?,?,?,?,?,?,?,?)",
      );
      for (const item of data) {
        await stmt.run(
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
      await qexec("DELETE FROM SkillQuestion");
    },
  },
  skillAttempt: {
    async findUnique({ where }: { where: { id: string } }) {
      const row = await qget("SELECT * FROM SkillAttempt WHERE id = ?", where.id) as Dict | undefined;
      if (!row) return null;
      return mapSkillAttempt(row);
    },
    async findMany({ include, orderBy, take, where }: { include?: Dict; orderBy?: Dict; take?: number; where?: Dict } = {}) {
      void orderBy;
      const liveOnly = Boolean(where?.completedAt === null);
      const rows = await qall(`SELECT ${liveOnly ? "*" : "id, talentId, startedAt, completedAt, score, passed, cameraEnabled, cameraOn, lastHeartbeat, questionIndex, stackName, answers"}
           FROM SkillAttempt
           ${liveOnly ? "WHERE completedAt IS NULL" : ""}
           ORDER BY startedAt DESC ${take ? `LIMIT ${Number(take)}` : ""}`,) as Dict[];
      return Promise.all(
        rows.map(async (row) => ({
        ...mapSkillAttempt(row),
        talent: include?.talent ? await getUserById(String(row.talentId)) : undefined,
      })),
      );
    },
    async create({ data }: { data: Dict }) {
      const attemptId = id();
      await qrun(`INSERT INTO SkillAttempt (id, talentId, startedAt, completedAt, score, passed, cameraEnabled, cameraOn, lastHeartbeat, cameraFrame, questionIndex, stackName, answers)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`, attemptId,
          data.talentId,
          data.startedAt ? new Date(data.startedAt as Date).toISOString() : now(),
          data.completedAt ? new Date(data.completedAt as Date).toISOString() : null,
          data.score ?? null,
          toBool(data.passed),
          toBool(data.cameraEnabled),
          toBool(data.cameraOn),
          data.lastHeartbeat ? new Date(data.lastHeartbeat as Date).toISOString() : null,
          data.cameraFrame ?? null,
          data.questionIndex ?? 0,
          data.stackName ?? null,
          data.answers ?? null,);
      return this.findUnique({ where: { id: attemptId } });
    },
    async update({ where, data }: { where: { id: string }; data: Dict }) {
      const current = await this.findUnique({ where });
      if (!current) return null;
      const completedAt =
        data.completedAt === undefined
          ? current.completedAt
            ? current.completedAt.toISOString()
            : null
          : data.completedAt
            ? new Date(data.completedAt as Date).toISOString()
            : null;
      const lastHeartbeat =
        data.lastHeartbeat === undefined
          ? current.lastHeartbeat
            ? current.lastHeartbeat.toISOString()
            : null
          : data.lastHeartbeat
            ? new Date(data.lastHeartbeat as Date).toISOString()
            : null;
      await qrun(`UPDATE SkillAttempt SET completedAt=?, score=?, passed=?, cameraEnabled=?, cameraOn=?, lastHeartbeat=?, cameraFrame=?, questionIndex=?, stackName=?, answers=? WHERE id=?`, completedAt,
          data.score === undefined ? current.score : data.score,
          data.passed === undefined ? toBool(current.passed) : toBool(data.passed),
          data.cameraEnabled === undefined ? toBool(current.cameraEnabled) : toBool(data.cameraEnabled),
          data.cameraOn === undefined ? toBool(current.cameraOn) : toBool(data.cameraOn),
          lastHeartbeat,
          data.cameraFrame === undefined ? current.cameraFrame : data.cameraFrame,
          data.questionIndex === undefined ? current.questionIndex : data.questionIndex,
          data.stackName === undefined ? current.stackName : data.stackName,
          data.answers === undefined ? current.answers : data.answers,
          where.id,);
      return this.findUnique({ where });
    },
    async deleteMany() {
      await qexec("DELETE FROM SkillAttempt");
    },
  },
  connectPurchase: {
    async findUnique({ where }: { where: Dict }) {
      const row = where.stripeSessionId
        ? (await qget("SELECT * FROM ConnectPurchase WHERE stripeSessionId = ?", where.stripeSessionId) as Dict | undefined)
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
      const rows = await qall(`SELECT * FROM ConnectPurchase ${where?.talentId ? "WHERE talentId = ?" : ""} ORDER BY createdAt DESC ${take ? `LIMIT ${Number(take)}` : ""}`, ...(where?.talentId ? [where.talentId] : [])) as Dict[];
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
      await qrun(`INSERT INTO ConnectPurchase (id, talentId, connects, amountCents, stripeSessionId, status, createdAt)
           VALUES (?,?,?,?,?,?,?)`, purchaseId,
          data.talentId,
          data.connects,
          data.amountCents,
          data.stripeSessionId ?? null,
          data.status ?? "completed",
          now(),);
      return { id: purchaseId, ...data, createdAt: new Date() };
    },
    async update({ where, data }: { where: { id: string }; data: Dict }) {
      await qrun("UPDATE ConnectPurchase SET status = ? WHERE id = ?", data.status, where.id);
      return { id: where.id, ...data };
    },
    async deleteMany() {
      await qexec("DELETE FROM ConnectPurchase");
    },
  },
  introVideo: {
    async save({ userId, buffer }: { userId: string; buffer: Buffer }) {
      await qrun("DELETE FROM IntroVideoChunk WHERE userId = ?", userId);
      const chunk = 90_000;
      for (let offset = 0, seq = 0; offset < buffer.length; offset += chunk, seq += 1) {
        await qrun(
          "INSERT INTO IntroVideoChunk (userId, seq, data) VALUES (?,?,?)",
          userId,
          seq,
          buffer.subarray(offset, offset + chunk).toString("base64"),
        );
      }
    },
    async load(userId: string) {
      const rows = (await qall("SELECT data FROM IntroVideoChunk WHERE userId = ? ORDER BY seq ASC", userId)) as Dict[];
      if (!rows.length) return null;
      return Buffer.concat(rows.map((row) => Buffer.from(String(row.data || ""), "base64")));
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
