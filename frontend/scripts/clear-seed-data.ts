import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // Delete seeded exam scores then exams (by known seeded titles)
  const seededExamTitles = [
    "Basic 6 Mid-Term Mathematics",
    "Basic 6 Mid-Term English",
    "JHS 1 Mid-Term Integrated Science",
    "JHS 1 Mid-Term Social Studies",
  ];
  const exams = await prisma.exam.findMany({ where: { title: { in: seededExamTitles } }, select: { id: true } });
  const examIds = exams.map(e => e.id);
  await prisma.examScore.deleteMany({ where: { examId: { in: examIds } } });
  await prisma.exam.deleteMany({ where: { id: { in: examIds } } });
  console.log(`Deleted ${examIds.length} seeded exams`);

  // Delete all announcements (they are all seeded — none created by user)
  const count = await prisma.announcement.deleteMany({});
  console.log(`Deleted ${count.count} announcements`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
