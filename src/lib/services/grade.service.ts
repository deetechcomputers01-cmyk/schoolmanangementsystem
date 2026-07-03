import type { SessionUser } from "@/types/auth";
import { assertCan } from "@/lib/auth/rbac";
import { prisma } from "@/lib/prisma";
import { audit } from "./audit.service";

export function listGrades() {
  return prisma.grade.findMany({
    orderBy: { createdAt: "desc" },
    include: { student: true, subject: true },
    take: 200
  });
}

export async function createGrade(user: SessionUser | null, input: { studentId: string; subjectId: string; term: string; score: number; remarks?: string }) {
  assertCan(user, "grades:write");
  const grade = await prisma.grade.create({ data: input, include: { student: true, subject: true } });
  await audit(user, "create", "Grade", grade.id, { score: grade.score });
  return grade;
}
