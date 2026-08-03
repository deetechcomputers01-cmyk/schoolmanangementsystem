import { type NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { getCurrentUser } from "@backend/auth/cookies";
import { prisma } from "@backend/prisma";
import { ok, unauthorized, forbidden, fail, handleApiError } from "@/lib/http";
import { audit } from "@backend/services/audit.service";

export const runtime = "nodejs";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; qid: string } }
) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (!["super_admin", "principal", "teacher"].includes(user.role)) return forbidden();

  try {
    const { text, options, correctAnswer, marks } = await req.json();
    if (!text?.trim()) return fail("Question text is required", 400);

    await prisma.examQuestion.update({
      where: { id: params.qid },
      data: {
        text: text.trim(),
        options: options ?? Prisma.DbNull,
        correctAnswer: correctAnswer ?? null,
        marks: Number(marks) || 1,
      },
    });
    await audit(user, "update_question", "ExamQuestion", params.qid, { examId: params.id });
    return ok({ success: true });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; qid: string } }
) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (!["super_admin", "principal", "teacher"].includes(user.role)) return forbidden();

  try {
    const question = await prisma.examQuestion.findUnique({ where: { id: params.qid }, select: { id: true, examId: true } });
    if (!question || question.examId !== params.id) return fail("Question not found", 404);

    await prisma.examQuestion.delete({ where: { id: params.qid } });
    await audit(user, "delete_question", "ExamQuestion", params.qid, { examId: params.id });
    return ok({ success: true });
  } catch (e) {
    return handleApiError(e);
  }
}
