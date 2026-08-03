import { type NextRequest } from "next/server";
import { getCurrentUser } from "@backend/auth/cookies";
import { prisma } from "@backend/prisma";
import { ok, unauthorized, forbidden, fail, handleApiError } from "@/lib/http";
import { audit } from "@backend/services/audit.service";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  try {
    const questions = await prisma.examQuestion.findMany({
      where: { examId: params.id },
      orderBy: { order: "asc" },
    });
    return ok(questions);
  } catch (e) {
    return handleApiError(e);
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (!["super_admin", "principal", "teacher"].includes(user.role)) return forbidden();

  try {
    const body = await req.json();
    const { text, type = "mcq", options, correctAnswer, marks = 1 } = body;
    if (!text) return fail("Question text is required", 400);

    const last = await prisma.examQuestion.findFirst({
      where: { examId: params.id },
      orderBy: { order: "desc" },
      select: { order: true },
    });
    const order = (last?.order ?? 0) + 1;

    const question = await prisma.examQuestion.create({
      data: {
        examId: params.id,
        order,
        text,
        type,
        options: options ?? undefined,
        correctAnswer: correctAnswer ?? null,
        marks: Number(marks),
      },
    });

    await audit(user, "add_question", "ExamQuestion", question.id, { examId: params.id });
    return ok(question, 201);
  } catch (e) {
    return handleApiError(e);
  }
}
