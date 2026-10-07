-- Wova production schema (SQLite / Turso)
-- Paste this into Turso → your database → Database Studio / SQL editor, then Run.

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

CREATE INDEX IF NOT EXISTS idx_user_role ON User(role);
CREATE INDEX IF NOT EXISTS idx_user_email ON User(email);
CREATE INDEX IF NOT EXISTS idx_job_client ON Job(clientId);
CREATE INDEX IF NOT EXISTS idx_job_status ON Job(status);
CREATE INDEX IF NOT EXISTS idx_application_job ON Application(jobId);
CREATE INDEX IF NOT EXISTS idx_application_talent ON Application(talentId);
CREATE INDEX IF NOT EXISTS idx_message_conversation ON Message(conversationId);
CREATE INDEX IF NOT EXISTS idx_skill_attempt_talent ON SkillAttempt(talentId);

CREATE TABLE IF NOT EXISTS IntroVideoChunk (
  userId TEXT NOT NULL,
  seq INTEGER NOT NULL,
  data TEXT NOT NULL,
  PRIMARY KEY (userId, seq)
);
