import { type NextRequest } from "next/server";
import { getCurrentUser } from "@backend/auth/cookies";
import { prisma } from "@backend/prisma";
import { ok, unauthorized, forbidden, fail, handleApiError } from "@/lib/http";
import { audit } from "@backend/services/audit.service";

export const runtime = "nodejs";

// POST /api/exams/[id]/attempts/[attemptId]/submit
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; attemptId: string } }
) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (user.role !== "student") return forbidden();

  try {
    // Fetch attempt and verify ownership
    const attempt = await prisma.examAttempt.findUnique({
      where: { id: params.attemptId },
      include: { student: { select: { userId: true } } },
    });
    if (!attempt) return fail("Attempt not found", 404);
    if (attempt.student.userId !== user.id) return forbidden();
    if (attempt.submittedAt) return fail("Exam already submitted", 400);

    const { answers } = await req.json() as { answers: Array<{ questionId: string; answer: string }> };
    if (!Array.isArray(answers)) return fail("answers array required", 400);

    // Load all questions for this exam
    const questions = await prisma.examQuestion.findMany({
      where: { examId: params.id },
      select: { id: true, type: true, correctAnswer: true, marks: true },
    });
    const qMap = new Map(questions.map((q) => [q.id, q]));

    // Score each answer
    let totalScore = 0;
    const totalMarks = questions.reduce((s, q) => s + Number(q.marks), 0);

    for (const a of answers) {
      const q = qMap.get(a.questionId);
      if (!q) continue;

      let isCorrect: boolean | null = null;
      let marksAwarded = 0;

      if (q.type === "mcq" && q.correctAnswer) {
        isCorrect = a.answer?.trim().toUpperCase() === q.correctAnswer.trim().toUpperCase();
        marksAwarded = isCorrect ? Number(q.marks) : 0;
      }

      totalScore += marksAwarded;

      await prisma.studentAnswer.upsert({
        where: { attemptId_questionId: { attemptId: params.attemptId, questionId: a.questionId } },
        create: {
          attemptId: params.attemptId,
          questionId: a.questionId,
          answer: a.answer ?? "",
          isCorrect,
          marksAwarded,
        },
        update: {
          answer: a.answer ?? "",
          isCorrect,
          marksAwarded,
        },
      });
    }

    // Mark attempt as submitted
    await prisma.examAttempt.update({
      where: { id: params.attemptId },
      data: { submittedAt: new Date(), score: totalScore },
    });

    await audit(user, "submit_exam", "ExamAttempt", params.attemptId, {
      examId: params.id, score: totalScore,
    });

    return ok({ score: totalScore, total: totalMarks });
  } catch (e) {
    return handleApiError(e);
  }
}
