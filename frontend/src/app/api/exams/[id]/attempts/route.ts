import { type NextRequest } from "next/server";
import { getCurrentUser } from "@backend/auth/cookies";
import { prisma } from "@backend/prisma";
import { ok, unauthorized, forbidden, fail, handleApiError } from "@/lib/http";

export const runtime = "nodejs";

// Teacher/admin: GET all attempts. Student: GET own attempt.
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  try {
    if (user.role === "student") {
      const studentRecord = await prisma.student.findFirst({ where: { userId: user.id } });
      if (!studentRecord) return fail("Student record not found", 404);

      const attempt = await prisma.examAttempt.findUnique({
        where: { examId_studentId: { examId: params.id, studentId: studentRecord.id } },
      });
      return ok(attempt ?? null);
    }

    // Staff — all attempts with student info (nested to match client AttemptRow shape)
    const rows = await prisma.examAttempt.findMany({
      where: { examId: params.id },
      orderBy: { startedAt: "desc" },
      include: { student: { select: { firstName: true, lastName: true, admissionNo: true } } },
    });
    const attempts = rows.map((r) => ({
      id: r.id,
      examId: r.examId,
      studentId: r.studentId,
      startedAt: r.startedAt,
      submittedAt: r.submittedAt,
      score: r.score,
      student: r.student,
    }));
    return ok(attempts);
  } catch (e) {
    return handleApiError(e);
  }
}

// Student starts or resumes an attempt
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (user.role !== "student") return forbidden();

  try {
    const studentRecord = await prisma.student.findFirst({ where: { userId: user.id } });
    if (!studentRecord) return fail("Student record not found", 404);

    // Check exam exists, is online, and student's class matches
    const exam = await prisma.exam.findUnique({ where: { id: params.id }, select: { id: true, isOnline: true, classId: true } });
    if (!exam) return fail("Exam not found", 404);
    if (!exam.isOnline) return fail("This exam is not available online", 400);
    if (exam.classId !== studentRecord.classId) return fail("You are not assigned to this exam", 403);

    // Check for existing attempt
    const existing = await prisma.examAttempt.findUnique({
      where: { examId_studentId: { examId: params.id, studentId: studentRecord.id } },
      select: { id: true, submittedAt: true },
    });

    if (existing) {
      if (existing.submittedAt) return fail("You have already submitted this exam", 400);
      return ok(existing);
    }

    const attempt = await prisma.examAttempt.create({
      data: { examId: params.id, studentId: studentRecord.id },
    });
    return ok(attempt, 201);
  } catch (e) {
    return handleApiError(e);
  }
}
