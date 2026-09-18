import { hash } from "bcryptjs";
import { prisma } from "./prisma";
import { extraClients, marketplaceJobs } from "../prisma/marketplace-data";
import { CODING_QUESTIONS, toCodeQuestionRow } from "./coding-questions";
import { DEMO_EXTRAS, stringifyExtras } from "./profile-extras";
import { jobDurationFromTitle, jobTypeFromTitle } from "./constants";
import { ADMIN_EMAIL, ADMIN_ID, ADMIN_NAME, adminPassword } from "./admin";

const questions = [
  {
    category: "Communication",
    prompt: "A client asks for a delivery date you know is unrealistic. What do you do first?",
    options: [
      "Agree immediately so you do not lose the job",
      "Explain the real timeline, tradeoffs, and a workable plan",
      "Ignore the request until they follow up",
      "Promise the date and hire someone else later",
    ],
    correctIndex: 1,
  },
  {
    category: "Scope",
    prompt: "Mid-project, a client adds work that was not in the original brief. Best next step?",
    options: [
      "Do it unpaid to keep them happy",
      "Refuse without explanation",
      "Document the change, estimate impact, and agree on extra time or budget",
      "Pause the project indefinitely",
    ],
    correctIndex: 2,
  },
  {
    category: "Quality",
    prompt: "You are about to submit work but found a small bug. The deadline is in 20 minutes. You should:",
    options: [
      "Ship anyway and hope they miss it",
      "Fix if it is quick; otherwise flag it clearly with a fix plan",
      "Delete the feature so the bug disappears",
      "Miss the deadline without saying anything",
    ],
    correctIndex: 1,
  },
  {
    category: "Problem solving",
    prompt: "You are blocked by missing credentials. The client is offline for 8 hours. What is the strongest move?",
    options: [
      "Wait and do nothing",
      "Work on independent tasks, document the blocker, and send one clear request",
      "Guess the credentials",
      "Close the contract",
    ],
    correctIndex: 1,
  },
  {
    category: "Web",
    prompt: "Which practice best protects user data in a web form?",
    options: [
      "Store passwords in plain text for easy support",
      "Validate on the client only",
      "Hash secrets, validate on the server, and use HTTPS",
      "Email every form submission to a shared inbox",
    ],
    correctIndex: 2,
  },
  {
    category: "Web",
    prompt: "A page is slow. Which investigation order is most professional?",
    options: [
      "Rewrite everything in a new framework",
      "Measure (network, images, queries), then fix the largest bottleneck",
      "Add a loading spinner and call it done",
      "Ask the client to upgrade their laptop",
    ],
    correctIndex: 1,
  },
  {
    category: "Collaboration",
    prompt: "You disagree with a client's design choice. How should you respond?",
    options: [
      "Implement it silently and complain later",
      "Share a concise rationale, show an alternative, and let them decide",
      "Publicly criticize the choice",
      "Refuse to continue unless they change it",
    ],
    correctIndex: 1,
  },
  {
    category: "Time",
    prompt: "You estimated 10 hours and you are at 9 hours with ~40% left. What next?",
    options: [
      "Keep going and surprise them with a late invoice",
      "Notify early, explain why, and agree on options (cut scope, extend, or extra hours)",
      "Rush and hide quality issues",
      "Abandon the remaining work",
    ],
    correctIndex: 1,
  },
  {
    category: "Professionalism",
    prompt: "A proposal should primarily:",
    options: [
      "Repeat the job post word for word",
      "Show relevant proof, a clear plan, timeline, and questions that reduce risk",
      "Talk only about your hourly rate",
      "Include your life story",
    ],
    correctIndex: 1,
  },
  {
    category: "Integrity",
    prompt: "You do not have a required skill listed in a high-badge job. You should:",
    options: [
      "Apply anyway and learn on the client's dime",
      "Skip it, or apply only if you can partner with someone skilled and say so",
      "Fake a portfolio",
      "Use AI output without review",
    ],
    correctIndex: 1,
  },
];

export async function seedDemoData() {
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.application.deleteMany();
  await prisma.connectPurchase.deleteMany();
  await prisma.skillAttempt.deleteMany();
  await prisma.skillQuestion.deleteMany();
  await prisma.job.deleteMany();
  await prisma.user.deleteMany();

  const password = await hash("Hireline123!", 10);
  const adminPasswordHash = await hash(adminPassword(), 10);

  await prisma.user.create({
    data: {
      id: ADMIN_ID,
      email: ADMIN_EMAIL,
      passwordHash: adminPasswordHash,
      role: "ADMIN",
      name: ADMIN_NAME,
      onboardingDone: true,
      phoneVerified: true,
      emailVerified: true,
    },
  });

  const client = await prisma.user.create({
    data: {
      id: "wova-user-jordan",
      email: "jordan@northfield.co",
      passwordHash: password,
      role: "CLIENT",
      name: "Jordan Hale",
      phone: "+1 415 555 0142",
      phoneVerified: true,
      onboardingDone: true,
      companyName: "Northfield Studio",
      companySize: "11-50",
      companyIndustry: "Design & Creative",
      companyWebsite: "https://northfield.example",
      companyLocation: "San Francisco, CA",
      paymentConnected: true,
      bio: "We hire specialists for brand, product, and growth sprints.",
    },
  });

  const client2 = await prisma.user.create({
    data: {
      id: "wova-user-priya",
      email: "priya@lumenops.com",
      passwordHash: password,
      role: "CLIENT",
      name: "Priya Raman",
      phone: "+1 206 555 0198",
      phoneVerified: true,
      onboardingDone: true,
      companyName: "LumenOps",
      companySize: "51-200",
      companyIndustry: "Software & IT",
      companyWebsite: "https://lumenops.example",
      companyLocation: "Seattle, WA",
      paymentConnected: true,
      bio: "Operations software for mid-market teams.",
    },
  });

  const talent = await prisma.user.create({
    data: {
      id: "wova-user-maya",
      email: "maya@talent.test",
      passwordHash: password,
      role: "TALENT",
      name: "Maya Chen",
      country: "United States",
      phone: "+1 917 555 0108",
      phoneVerified: true,
      onboardingDone: true,
      linkedinUrl: "https://www.linkedin.com/in/maya-chen-example",
      resumeUrl: "/uploads/sample-resume.txt",
      avatarUrl: "/avatars/maya.jpg",
      title: "Product Designer & Front-End Engineer",
      hourlyRate: 75,
      skills: JSON.stringify(["React", "Figma", "TypeScript", "UI design"]),
      skillTestPassed: true,
      talentBadge: true,
      connects: 80,
      bio: "Product designer and front-end engineer with 7 years shipping B2B dashboards. I take messy product specs and turn them into clear UI, then implement the React that clients can actually ship. Recent work covers design systems, intake forms, and dense admin tools.",
      extras: stringifyExtras(DEMO_EXTRAS["maya@talent.test"]),
    },
  });

  const talent2 = await prisma.user.create({
    data: {
      id: "wova-user-diego",
      email: "diego@talent.test",
      passwordHash: password,
      role: "TALENT",
      name: "Diego Alvarez",
      country: "United States",
      phone: "+1 312 555 0166",
      phoneVerified: true,
      onboardingDone: true,
      linkedinUrl: "https://www.linkedin.com/in/diego-alvarez-example",
      resumeUrl: "/uploads/sample-resume.txt",
      avatarUrl: "/avatars/diego.jpg",
      title: "Full-Stack TypeScript Developer",
      hourlyRate: 85,
      skills: JSON.stringify(["Next.js", "Node.js", "PostgreSQL", "Payments"]),
      skillTestPassed: true,
      talentBadge: true,
      connects: 40,
      bio: "Full-stack TypeScript developer focused on marketplaces and payments. I like well-scoped builds: auth, billing, job boards, and the messy data in between. I write the plan first, then ship in small PRs with notes a client can follow.",
      extras: stringifyExtras(DEMO_EXTRAS["diego@talent.test"]),
    },
  });

  const clientsByKey: Record<string, string> = {
    northfield: client.id,
    lumenops: client2.id,
  };

  for (const extra of extraClients) {
    const created = await prisma.user.create({
      data: {
        email: extra.email,
        passwordHash: password,
        role: "CLIENT",
        name: extra.name,
        phone: extra.phone,
        phoneVerified: true,
        onboardingDone: true,
        companyName: extra.companyName,
        companySize: extra.companySize,
        companyIndustry: extra.companyIndustry,
        companyWebsite: extra.companyWebsite,
        companyLocation: extra.companyLocation,
        paymentConnected: true,
        bio: extra.bio,
        id: `wova-user-${extra.key}`,
      },
    });
    clientsByKey[extra.key] = created.id;
  }

  await prisma.skillQuestion.createMany({
    data: [
      ...questions.map((q) => ({
        ...q,
        options: JSON.stringify(q.options),
        kind: "mcq",
        starterCode: null,
        functionName: null,
        tests: null,
      })),
      ...CODING_QUESTIONS.map(toCodeQuestionRow),
    ],
  });

  const talentByKey = { maya: talent.id, diego: talent2.id };
  let job1: { id: string } | null = null;

  for (const item of marketplaceJobs) {
    const job = await prisma.job.create({
      data: {
        title: item.title,
        description: item.description,
        category: item.category,
        skills: JSON.stringify(item.skills),
        budgetMin: item.budgetMin,
        budgetMax: item.budgetMax,
        budgetType: item.budgetType,
        jobType: jobTypeFromTitle(item.title),
        duration: jobDurationFromTitle(item.title),
        highBadge: item.highBadge,
        connectCost: item.connectCost,
        status: item.status,
        clientId: clientsByKey[item.clientKey],
        createdAt: item.createdAt,
      },
    });
    if (item.clientKey === "northfield" && item.status === "OPEN") job1 = job;
    if (item.hiredKey) {
      await prisma.application.create({
        data: {
          jobId: job.id,
          talentId: talentByKey[item.hiredKey],
          coverLetter:
            "I have done this kind of brief before. I will confirm scope on day one, send a short plan, and keep updates on the Wova thread.",
          connectsUsed: item.connectCost,
          status: "HIRED",
          createdAt: item.createdAt,
        },
      });
    }
  }

  if (!job1) throw new Error("Northfield open job missing from marketplace data.");

  await prisma.application.create({
    data: {
      jobId: job1.id,
      talentId: talent.id,
      coverLetter:
        "I have cleaned two studio files like this — one for a 15-person brand shop. I would start with a cut list you approve, then a small button/input/card library in your green/cream palette, plus a one-page how-to.",
      connectsUsed: 10,
      status: "PENDING",
    },
  });

  const pair =
    talent.id < client.id ? { userAId: talent.id, userBId: client.id } : { userAId: client.id, userBId: talent.id };
  const convo = await prisma.conversation.create({ data: pair });
  await prisma.message.create({
    data: {
      conversationId: convo.id,
      senderId: client.id,
      content: "Maya — liked your onboarding note. Could you share a before/after from a previous flow?",
    },
  });
  await prisma.message.create({
    data: {
      conversationId: convo.id,
      senderId: talent.id,
      content: "Sending a Loom and the Figma file today. The biggest win was cutting account-setup until after first value.",
    },
  });

  await prisma.skillAttempt.create({
    data: {
      talentId: talent.id,
      completedAt: new Date(),
      score: 90,
      passed: true,
      cameraEnabled: true,
      answers: "[]",
    },
  });

  await prisma.connectPurchase.create({
    data: {
      talentId: talent.id,
      connects: 100,
      amountCents: 1000,
      status: "completed",
    },
  });
}
