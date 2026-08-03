import { type NextRequest } from "next/server";
import { getCurrentUser } from "@backend/auth/cookies";
import { prisma } from "@backend/prisma";
import { ok, unauthorized, forbidden, fail, handleApiError } from "@/lib/http";
import { audit } from "@backend/services/audit.service";

export const runtime = "nodejs";

// POST /api/exams/[id]/attempts/[attemptId]/grade — teacher/admin marks short-answer questions
export async function POST(req: NextRequest, { params }: { params: { id: string; attemptId: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (!["super_admin", "principal", "teacher"].includes(user.role)) return forbidden();

  try {
    const attempt = await prisma.examAttempt.findUnique({ where: { id: params.attemptId } });
    if (!attempt || attempt.examId !== params.id) return fail("Attempt not found", 404);

    const { grades } = await req.json() as { grades: Array<{ questionId: string; marksAwarded: number }> };
    if (!Array.isArray(grades)) return fail("grades array required", 400);

    const questions = await prisma.examQuestion.findMany({ where: { examId: params.id }, select: { id: true, marks: true } });
    const marksByQuestion = new Map(questions.map((q) => [q.id, q.marks]));

    for (const g of grades) {
      const maxMarks = marksByQuestion.get(g.questionId);
      if (maxMarks === undefined) continue;
      const marksAwarded = Math.max(0, Math.min(maxMarks, Number(g.marksAwarded) || 0));
      await prisma.studentAnswer.update({
        where: { attemptId_questionId: { attemptId: params.attemptId, questionId: g.questionId } },
        data: { marksAwarded, isCorrect: marksAwarded >= maxMarks },
      });
    }

    const allAnswers = await prisma.studentAnswer.findMany({ where: { attemptId: params.attemptId }, select: { marksAwarded: true } });
    const totalScore = allAnswers.reduce((sum, a) => sum + (a.marksAwarded ?? 0), 0);

    await prisma.examAttempt.update({ where: { id: params.attemptId }, data: { score: totalScore } });
    await audit(user, "grade_exam", "ExamAttempt", params.attemptId, { examId: params.id, score: totalScore });

    return ok({ score: totalScore });
  } catch (e) {
    return handleApiError(e);
  }
}
