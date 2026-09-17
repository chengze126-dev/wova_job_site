import { prisma } from "../lib/prisma";
import { seedDemoData } from "../lib/seed-demo";

async function main() {
  await seedDemoData();
  console.log("Seeded Wova.");
  console.log("Admin:  admin@hireline.local / AdminHireline!2026");
  console.log("Client: jordan@northfield.co / Hireline123!");
  console.log("Talent: maya@talent.test / Hireline123!");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
