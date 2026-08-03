import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const { count } = await prisma.timetableSlot.deleteMany();
  console.log(`Deleted ${count} timetable slots`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
