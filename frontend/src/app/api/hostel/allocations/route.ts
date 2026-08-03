import { type NextRequest } from "next/server";
import { getCurrentUser } from "@backend/auth/cookies";
import { allocateStudent, vacateStudent } from "@backend/services/hostel.service";
import { ok, badRequest, unauthorized, handleApiError } from "@/lib/http";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const body = await request.json().catch(() => ({}));
  const { studentId, roomId, bedNumber } = body;
  if (!studentId || !roomId || typeof bedNumber !== "number") {
    return badRequest({ message: ["studentId, roomId, and bedNumber are required"] });
  }
  try {
    return ok(await allocateStudent(user, { studentId, roomId, bedNumber }), 201);
  } catch (e) {
    return handleApiError(e);
  }
}

export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const studentId = request.nextUrl.searchParams.get("studentId");
  if (!studentId) return badRequest({ studentId: ["studentId is required"] });
  try {
    return ok(await vacateStudent(user, studentId));
  } catch (e) {
    return handleApiError(e);
  }
}
