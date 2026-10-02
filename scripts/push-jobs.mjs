import { readFileSync } from "fs";
import { resolve } from "path";
import { randomBytes } from "crypto";
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
if (!url || !authToken) {
  console.error("Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in .env, then run: npm run db:jobs");
  process.exit(1);
}

const client = createClient({ url, authToken });
const now = new Date().toISOString();
const passwordHash = hashSync(randomBytes(24).toString("hex"), 10);

const companies = [
  {
    id: "wova-user-kindling",
    email: "omar@kindling.health",
    name: "Omar Haddad",
    companyName: "Kindling Health",
    companySize: "51-200",
    companyIndustry: "Healthcare",
    companyWebsite: "https://kindling.example",
    companyLocation: "Denver, CO",
    bio: "Clinic software for independent practices.",
  },
  {
    id: "wova-user-oak",
    email: "nina@oakandpine.shop",
    name: "Nina Pell",
    companyName: "Oak & Pine",
    companySize: "2-10",
    companyIndustry: "E-commerce",
    companyWebsite: "https://oakandpine.example",
    companyLocation: "Portland, OR",
    bio: "Direct-to-consumer home goods.",
  },
  {
    id: "wova-user-harbor",
    email: "elena@harborledger.example",
    name: "Elena Voss",
    companyName: "Harbor Ledger",
    companySize: "11-50",
    companyIndustry: "Finance",
    companyWebsite: "https://harborledger.example",
    companyLocation: "Austin, TX",
    bio: "Bookkeeping software for independent firms.",
  },
  {
    id: "wova-user-brightline",
    email: "chris@brightline.media",
    name: "Chris Adeyemi",
    companyName: "Brightline Media",
    companySize: "11-50",
    companyIndustry: "Marketing",
    companyWebsite: "https://brightline.example",
    companyLocation: "Brooklyn, NY",
    bio: "B2B content studio.",
  },
  {
    id: "wova-user-fieldnote",
    email: "sara@fieldnote.labs",
    name: "Sara Kim",
    companyName: "Fieldnote Labs",
    companySize: "11-50",
    companyIndustry: "Software & IT",
    companyWebsite: "https://fieldnote.example",
    companyLocation: "Boulder, CO",
    bio: "Field data tools for environmental teams.",
  },
  {
    id: "wova-user-copperline",
    email: "marcus@copperline.logistics",
    name: "Marcus Reed",
    companyName: "Copperline Logistics",
    companySize: "201-1000",
    companyIndustry: "Operations",
    companyWebsite: "https://copperline.example",
    companyLocation: "Chicago, IL",
    bio: "Regional freight and last-mile routing.",
  },
  {
    id: "wova-user-northfield",
    email: "jordan@northfield.co",
    name: "Jordan Hale",
    companyName: "Northfield Studio",
    companySize: "11-50",
    companyIndustry: "Design & Creative",
    companyWebsite: "https://northfield.example",
    companyLocation: "San Francisco, CA",
    bio: "We hire specialists for brand, product, and growth sprints.",
  },
  {
    id: "wova-user-lumenops",
    email: "priya@lumenops.com",
    name: "Priya Raman",
    companyName: "LumenOps",
    companySize: "51-200",
    companyIndustry: "Software & IT",
    companyWebsite: "https://lumenops.example",
    companyLocation: "Seattle, WA",
    bio: "Operations software for mid-market teams.",
  },
];

const jobs = [
  {
    id: "wova-job-react-intake",
    clientId: "wova-user-kindling",
    title: "Need a React engineer to finish our patient intake form (2–3 weeks)",
    description:
      "We are a 40-person clinic software company in Denver. The intake form is already in React + TypeScript. Patients can start it, but save-and-resume is broken, insurance photo upload fails on iPhone, and the Spanish copy is mixed into the English file.\n\nWhat we need done:\n- Fix save-and-resume against our existing REST API\n- Compress and retry photo uploads\n- Move copy into a simple i18n file (en / es)\n- Write a short QA checklist our nurse lead can run\n\nWe are not looking for a redesign or a rewrite. If you have shipped a similar healthcare or intake form, say so in the first paragraph and include one link. Overlap with Mountain Time is required for two standups a week.",
    category: "Web Development",
    skills: ["React", "TypeScript", "REST APIs"],
    budgetMin: 45,
    budgetMax: 75,
    budgetType: "hourly",
    highBadge: 0,
    connectCost: 10,
    createdAt: "2026-10-01T16:40:00.000Z",
  },
  {
    id: "wova-job-shopify-recharge",
    clientId: "wova-user-oak",
    title: "Shopify Plus: subscription boxes keep charging the old price",
    description:
      "Oak & Pine sells seasonal home goods. We run Shopify Plus with Recharge. After we changed three bundle SKUs last month, about 180 subscribers are still billed at the 2025 price. Support is getting the tickets.\n\nNeed someone who has cleaned this up before — not a theme redesign.\n\nScope:\n- Find why Recharge is ignoring the new variant prices\n- Patch or remigrate the affected subscriptions\n- Add a one-page admin note so our ops lead can check it next season\n- Stay on Slack for 5 business days after launch\n\nPlease say how many Recharge / Shopify Plus stores you have shipped and whether you can start this week.",
    category: "Web Development",
    skills: ["Shopify", "Recharge", "Liquid"],
    budgetMin: 2800,
    budgetMax: 4200,
    budgetType: "fixed",
    highBadge: 1,
    connectCost: 16,
    createdAt: "2026-09-30T13:15:00.000Z",
  },
  {
    id: "wova-job-stripe-qbo",
    clientId: "wova-user-harbor",
    title: "QuickBooks Online + Stripe: monthly reconciliation is off by $2–4k",
    description:
      "Harbor Ledger is a bookkeeping product for small CPA firms. Every month our Stripe payouts and QBO bank feed disagree by a few thousand dollars. It is usually fees, partial refunds, and disputes landing in the wrong account.\n\nWe want a contractor who has done Stripe → QBO mapping for a SaaS or marketplace, not a general bookkeeper.\n\nDeliverables:\n- Written map of payouts, fees, refunds, disputes\n- Script or Zapier/Make flow we can run on the 1st\n- 45-minute walkthrough with our staff accountant\n\nWe use Stripe Connect (destination charges). If that is not in your past work, please do not apply.",
    category: "Data",
    skills: ["Stripe", "QuickBooks", "Reconciliation"],
    budgetMin: 3500,
    budgetMax: 5500,
    budgetType: "fixed",
    highBadge: 1,
    connectCost: 18,
    createdAt: "2026-09-28T11:05:00.000Z",
  },
  {
    id: "wova-job-case-studies",
    clientId: "wova-user-brightline",
    title: "Ghostwriter for 6 B2B case studies (interviews already booked)",
    description:
      "Brightline is a content studio in Brooklyn. We have six customer interviews on the calendar in September (fintech and logistics brands). We need a writer who can turn a 40-minute call into a 900–1,200 word case study our clients will put on their site.\n\nYou will get a recording, a transcript, and a one-page outline. We do two rounds of edits. No AI-only first drafts — we will check.\n\nPlease send two published case studies (B2B, not lifestyle) and your turnaround time per piece. Rate can be per study or for the set.",
    category: "Writing",
    skills: ["Case studies", "B2B", "Interviews"],
    budgetMin: 2400,
    budgetMax: 3600,
    budgetType: "fixed",
    highBadge: 0,
    connectCost: 10,
    createdAt: "2026-09-26T18:50:00.000Z",
  },
  {
    id: "wova-job-android-fieldnote",
    clientId: "wova-user-fieldnote",
    title: "Android engineer: Play Console listing + crash on Android 12 devices",
    description:
      "Fieldnote Labs makes a field-data app for watershed teams. Play Console rejected our last listing for screenshots and a missing data-safety form. Separately, Samsung A-series phones on Android 12 crash when a user opens the offline map.\n\nWe need about 30 hours over two weeks:\n- New store listing, screenshots, and data-safety answers\n- Fix the offline-map crash (Mapbox) and a short regression note\n\nKotlin codebase. We can give you a device farm login. Please mention one Play launch you have done.",
    category: "Mobile Development",
    skills: ["Kotlin", "Android", "Mapbox"],
    budgetMin: 50,
    budgetMax: 80,
    budgetType: "hourly",
    highBadge: 0,
    connectCost: 10,
    createdAt: "2026-09-24T09:20:00.000Z",
  },
  {
    id: "wova-job-looker-freight",
    clientId: "wova-user-copperline",
    title: "Looker dashboard for on-time delivery — our ops team will not use sheets anymore",
    description:
      "Copperline moves freight in the Midwest. Dispatch still pastes CSV into Google Sheets every Monday. We have BigQuery loaded nightly. We need one Looker (or Looker Studio if you can make the case) dashboard: on-time %, dwell time, and top delay reasons by lane.\n\nYou will talk to two dispatchers and our data engineer. No executive slide deck. If the dashboard is not something a dispatcher will open at 6 a.m., it is not done.\n\n6–8 years of warehouse or logistics reporting is a plus. Include a screenshot of a similar board (blur names).",
    category: "Data",
    skills: ["BigQuery", "Looker", "SQL"],
    budgetMin: 4200,
    budgetMax: 6800,
    budgetType: "fixed",
    highBadge: 1,
    connectCost: 20,
    createdAt: "2026-09-22T14:10:00.000Z",
  },
  {
    id: "wova-job-figma-system",
    clientId: "wova-user-northfield",
    title: "Figma file is a mess — need a usable design system before we hire two juniors",
    description:
      "Northfield is a 22-person brand studio. Our main client file has 140 frames, no components, and three versions of the same button. We are hiring two junior designers in September and cannot onboard them into this.\n\nNeed a contractor to:\n- Audit the file and throw out unused frames (we will approve the cut list)\n- Build a small library: type, color, buttons, inputs, cards\n- Write a one-page “how we use this file” note\n\nThis is not a rebrand. You will work inside our existing green/cream palette. Please show a before/after from a file you cleaned.",
    category: "Design",
    skills: ["Figma", "Design systems", "UI kit"],
    budgetMin: 2200,
    budgetMax: 3400,
    budgetType: "fixed",
    highBadge: 0,
    connectCost: 10,
    createdAt: "2026-09-20T17:30:00.000Z",
  },
  {
    id: "wova-job-intercom-macros",
    clientId: "wova-user-lumenops",
    title: "Intercom: we need a first-response playbook and 25 macros by Friday week after next",
    description:
      "LumenOps support is four people and a pile of saved replies nobody trusts. Average first response is 11 hours. We want a contractor who has set up Intercom for a B2B SaaS team, not a general VA.\n\nWork:\n- Listen to 15 recent tickets (we will export)\n- Write a first-response standard (when to escalate, when to refund, when to book CS)\n- Build 25 macros and a simple teammate view\n- 90-minute training on a recorded Zoom\n\nEnglish native or equivalent. Overlap with US Pacific 10–1 a few days.",
    category: "Customer Support",
    skills: ["Intercom", "Macros", "Support ops"],
    budgetMin: 1600,
    budgetMax: 2300,
    budgetType: "fixed",
    highBadge: 0,
    connectCost: 10,
    createdAt: "2026-09-18T20:05:00.000Z",
  },
  {
    id: "wova-job-product-photo",
    clientId: "wova-user-oak",
    title: "Need a photographer who can shoot 40 SKUs in our Portland studio",
    description:
      "We have a daylight studio in SE Portland for two days in mid-September. 40 SKUs: ceramics, linen, and small furniture. We need consistent web images (4:5) plus 8 lifestyle frames for the homepage.\n\nYou bring lights if we need them; we have a foam sweep and a stylist for one of the days. Deliver edited JPEGs + RAWs within 5 business days.\n\nLocal to Portland strongly preferred. Please send a product-photo set, not portraits.",
    category: "Design",
    skills: ["Product photography", "Retouching", "E-commerce"],
    budgetMin: 1800,
    budgetMax: 2600,
    budgetType: "fixed",
    highBadge: 0,
    connectCost: 10,
    createdAt: "2026-09-16T15:45:00.000Z",
  },
  {
    id: "wova-job-bookkeeper",
    clientId: "wova-user-harbor",
    title: "Part-time bookkeeper who is comfortable in Stripe and Gusto (ongoing)",
    description:
      "We need 8–10 hours a week for the rest of the year: categorize Harbor Ledger’s own books, chase two contractor invoices, and keep Gusto payroll in QBO. This is not client work — it is our internal books.\n\nMust have used Stripe dashboard and Gusto before. CPA not required. Weekly Slack check-in, no video unless something is off.\n\nStart with a 30-day trial at the hourly rate, then we talk about a longer retainer.",
    category: "Data",
    skills: ["Bookkeeping", "Gusto", "QuickBooks"],
    budgetMin: 35,
    budgetMax: 55,
    budgetType: "hourly",
    highBadge: 0,
    connectCost: 10,
    createdAt: "2026-09-14T12:00:00.000Z",
  },
];

function jobTypeFromTitle(title) {
  const t = title.toLowerCase();
  if (t.includes("part-time")) return "Part-time";
  if (t.includes("photographer") || t.includes("shoot 40")) return "Temporary";
  if (t.includes("android engineer")) return "Full-time";
  return "Contract";
}

function jobDurationFromTitle(title) {
  const t = title.toLowerCase();
  if (t.includes("ongoing") || t.includes("bookkeeper")) return "More than 6 months";
  if (t.includes("2–3 weeks") || t.includes("2-3 weeks") || t.includes("week after next") || t.includes("40 skus")) {
    return "Less than 1 month";
  }
  if (t.includes("android") || t.includes("design system")) return "3–6 months";
  return "1–3 months";
}

const idByKey = {};

for (const company of companies) {
  const originalId = company.id;
  const existing = await client.execute({
    sql: "SELECT id FROM User WHERE id = ? OR lower(email) = ?",
    args: [company.id, company.email.toLowerCase()],
  });
  const row = existing.rows[0];
  if (row) {
    await client.execute({
      sql: `UPDATE User SET
        name=?, role='CLIENT', companyName=?, companySize=?, companyIndustry=?, companyWebsite=?,
        companyLocation=?, bio=?, onboardingDone=1, paymentConnected=1, emailVerified=1, phoneVerified=1, updatedAt=?
        WHERE id=?`,
      args: [
        company.name,
        company.companyName,
        company.companySize,
        company.companyIndustry,
        company.companyWebsite,
        company.companyLocation,
        company.bio,
        now,
        row.id,
      ],
    });
    idByKey[originalId] = String(row.id);
    console.log("updated company", company.companyName);
  } else {
    await client.execute({
      sql: `INSERT INTO User (
        id, email, passwordHash, role, name, country, bio, createdAt, updatedAt,
        phoneVerified, emailVerified, onboardingDone, paymentConnected, connects,
        companyName, companySize, companyIndustry, companyWebsite, companyLocation
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      args: [
        company.id,
        company.email.toLowerCase(),
        passwordHash,
        "CLIENT",
        company.name,
        "United States",
        company.bio,
        now,
        now,
        1,
        1,
        1,
        1,
        0,
        company.companyName,
        company.companySize,
        company.companyIndustry,
        company.companyWebsite,
        company.companyLocation,
      ],
    });
    idByKey[originalId] = originalId;
    console.log("created company", company.companyName);
  }
}

for (const job of jobs) {
  const clientId = idByKey[job.clientId];
  if (!clientId) throw new Error(`Missing company for ${job.id}`);
  const existing = await client.execute({
    sql: "SELECT id FROM Job WHERE id = ? OR title = ?",
    args: [job.id, job.title],
  });
  const jobType = jobTypeFromTitle(job.title);
  const duration = jobDurationFromTitle(job.title);
  const skills = JSON.stringify(job.skills);
  const row = existing.rows[0];
  if (row) {
    await client.execute({
      sql: `UPDATE Job SET
        title=?, description=?, category=?, skills=?, budgetMin=?, budgetMax=?, budgetType=?,
        jobType=?, duration=?, highBadge=?, connectCost=?, status='OPEN', clientId=?
        WHERE id=?`,
      args: [
        job.title,
        job.description,
        job.category,
        skills,
        job.budgetMin,
        job.budgetMax,
        job.budgetType,
        jobType,
        duration,
        job.highBadge,
        job.connectCost,
        clientId,
        row.id,
      ],
    });
    console.log("updated job", job.title.slice(0, 48));
  } else {
    await client.execute({
      sql: `INSERT INTO Job (
        id, title, description, category, skills, budgetMin, budgetMax, budgetType,
        jobType, duration, highBadge, connectCost, status, clientId, createdAt
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      args: [
        job.id,
        job.title,
        job.description,
        job.category,
        skills,
        job.budgetMin,
        job.budgetMax,
        job.budgetType,
        jobType,
        duration,
        job.highBadge,
        job.connectCost,
        "OPEN",
        clientId,
        job.createdAt,
      ],
    });
    console.log("created job", job.title.slice(0, 48));
  }
}

const count = await client.execute("SELECT COUNT(*) AS c FROM Job WHERE status = 'OPEN'");
console.log("open jobs", Number(count.rows[0]?.c ?? 0));
