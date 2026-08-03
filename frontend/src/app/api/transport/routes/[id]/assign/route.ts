import { type NextRequest } from "next/server";
import { getCurrentUser } from "@backend/auth/cookies";
import { assignStudentsToRoute, unassignStudentFromRoute } from "@backend/services/transport.service";
import { ok, badRequest, unauthorized, handleApiError } from "@/lib/http";

export const runtime = "nodejs";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const body = await request.json().catch(() => ({}));
  const { studentIds } = body;
  if (!Array.isArray(studentIds) || studentIds.length === 0) {
    return badRequest({ studentIds: ["At least one student must be selected"] });
  }
  try {
    return ok(await assignStudentsToRoute(user, params.id, studentIds), 201);
  } catch (e) {
    return handleApiError(e);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const studentId = request.nextUrl.searchParams.get("studentId");
  if (!studentId) return badRequest({ studentId: ["studentId is required"] });
  try {
    await unassignStudentFromRoute(user, params.id, studentId);
    return ok({ success: true });
  } catch (e) {
    return handleApiError(e);
  }
}
