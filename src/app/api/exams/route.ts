import { type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/cookies";
import { listExams, createExam } from "@/lib/services/exam.service";
import { createExamSchema } from "@/lib/validation/exams";
import { ok, badRequest, forbidden, unauthorized } from "@/lib/http";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const { searchParams } = new URL(request.url);
  const exams = await listExams({
    classId:   searchParams.get("classId")   ?? undefined,
    subjectId: searchParams.get("subjectId") ?? undefined,
    termId:    searchParams.get("termId")    ?? undefined
  });
  return ok(exams);
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (user.role !== "super_admin" && user.role !== "principal" && user.role !== "teacher") return forbidden();

  const body = await request.json();
  const parsed = createExamSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.flatten().fieldErrors);

  const exam = await createExam(user, parsed.data);
  return ok(exam, 201);
}
