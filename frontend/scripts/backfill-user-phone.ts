// One-time backfill: copy Guardian.phone / Staff.phone onto the linked
// User.phone (needed for the new phone+OTP password-reset flow), skipping
// any phone number that's already used by a different user (User.phone is
// unique). Safe to re-run — only fills users that are still missing a phone.
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  let filled = 0;
  let skipped = 0;

  const guardians = await prisma.guardian.findMany({
    where: { userId: { not: null } },
    select: { userId: true, phone: true },
  });
  const staff = await prisma.staff.findMany({
    where: { userId: { not: null } },
    select: { userId: true, phone: true },
  });

  for (const { userId, phone } of [...guardians, ...staff]) {
    if (!userId || !phone) continue;
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { phone: true } });
    if (!user || user.phone) continue; // already has a phone, or user vanished

    const existingOwner = await prisma.user.findUnique({ where: { phone } });
    if (existingOwner) {
      skipped++;
      continue;
    }

    await prisma.user.update({ where: { id: userId }, data: { phone } });
    filled++;
  }

  console.log(`Backfilled ${filled} user(s) with a phone number. Skipped ${skipped} due to conflicts.`);
}

main()
  .catch((e) => { console.error(e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
