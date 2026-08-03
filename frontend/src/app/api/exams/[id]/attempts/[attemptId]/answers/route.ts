import { type NextRequest } from "next/server";
import { getCurrentUser } from "@backend/auth/cookies";
import { prisma } from "@backend/prisma";
import { ok, unauthorized, forbidden, fail, handleApiError } from "@/lib/http";

export const runtime = "nodejs";

// GET /api/exams/[id]/attempts/[attemptId]/answers — teacher/admin: full answer sheet for grading
export async function GET(_req: NextRequest, { params }: { params: { id: string; attemptId: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (!["super_admin", "principal", "teacher"].includes(user.role)) return forbidden();

  try {
    const attempt = await prisma.examAttempt.findUnique({ where: { id: params.attemptId } });
    if (!attempt || attempt.examId !== params.id) return fail("Attempt not found", 404);

    const questions = await prisma.examQuestion.findMany({
      where: { examId: params.id },
      orderBy: { order: "asc" },
    });
    const answers = await prisma.studentAnswer.findMany({ where: { attemptId: params.attemptId } });
    const answerByQuestion = new Map(answers.map((a) => [a.questionId, a]));

    const rows = questions.map((q) => {
      const a = answerByQuestion.get(q.id);
      return {
        questionId: q.id,
        order: q.order,
        text: q.text,
        type: q.type,
        marks: q.marks,
        correctAnswer: q.correctAnswer,
        answer: a?.answer ?? null,
        isCorrect: a?.isCorrect ?? null,
        marksAwarded: a?.marksAwarded ?? 0,
      };
    });

    return ok(rows);
  } catch (e) {
    return handleApiError(e);
  }
}
