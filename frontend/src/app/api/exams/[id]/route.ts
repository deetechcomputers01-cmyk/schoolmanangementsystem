import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@backend/auth/cookies";
import { getExam, deleteExam } from "@backend/services/exam.service";
import { prisma } from "@backend/prisma";
import { ok, forbidden, unauthorized, notFound, handleApiError } from "@/lib/http";
import { audit } from "@backend/services/audit.service";

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

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (!["super_admin", "principal", "teacher"].includes(user.role)) return forbidden();

  try {
    const body = await request.json();
    const { isOnline, duration } = body;

    const updated = await prisma.exam.update({
      where: { id: params.id },
      data: {
        isOnline: isOnline !== undefined ? Boolean(isOnline) : undefined,
        duration: duration !== undefined ? (duration === null ? null : Number(duration)) : undefined,
      },
    });
    await audit(user, "update_exam", "Exam", params.id, { isOnline, duration });
    return ok(updated);
  } catch (e) {
    return handleApiError(e);
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
