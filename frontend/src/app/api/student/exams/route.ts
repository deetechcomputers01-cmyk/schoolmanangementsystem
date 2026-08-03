import { getCurrentUser } from "@backend/auth/cookies";
import { prisma } from "@backend/prisma";
import { ok, unauthorized, forbidden, fail, handleApiError } from "@/lib/http";

export const runtime = "nodejs";

// GET /api/student/exams — online exams assigned to the logged-in student's class
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (user.role !== "student") return forbidden();

  try {
    const studentRecord = await prisma.student.findFirst({ where: { userId: user.id } });
    if (!studentRecord) return fail("Student record not found", 404);

    // Fetch online exams for this class with question count + attempt status
    const exams = await prisma.exam.findMany({
      where: { classId: studentRecord.classId, isOnline: true },
      orderBy: { scheduledAt: "asc" },
      include: {
        subject: { select: { name: true } },
        questions: { select: { marks: true } },
        attempts: { where: { studentId: studentRecord.id }, select: { id: true, submittedAt: true, score: true } },
      },
    });

    const result = exams.map((e) => {
      const attempt = e.attempts[0];
      return {
        id:            e.id,
        title:         e.title,
        subjectName:   e.subject.name,
        scheduledAt:   e.scheduledAt.toISOString(),
        duration:      e.duration,
        totalMarks:    e.questions.reduce((sum, q) => sum + q.marks, 0),
        questionCount: e.questions.length,
        attemptStatus: attempt
          ? (attempt.submittedAt ? "submitted" : "in_progress")
          : "not_started",
        score: attempt?.score ?? null,
      };
    });

    return ok(result);
  } catch (e) {
    return handleApiError(e);
  }
}
