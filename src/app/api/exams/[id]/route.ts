import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/cookies";
import { getExam, deleteExam } from "@/lib/services/exam.service";
import { ok, forbidden, unauthorized, notFound } from "@/lib/http";

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  try {
    const exam = await getExam(params.id);
    return ok(exam);
  } catch {
    return notFound();
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (user.role !== "super_admin" && user.role !== "principal") return forbidden();

  try {
    const exam = await deleteExam(user, params.id);
    return ok(exam);
  } catch (e: unknown) {
    if (e instanceof Error) return NextResponse.json({ error: e.message }, { status: 400 });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
