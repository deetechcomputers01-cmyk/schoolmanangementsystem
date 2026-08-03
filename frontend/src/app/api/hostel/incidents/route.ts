import { type NextRequest } from "next/server";
import { getCurrentUser } from "@backend/auth/cookies";
import { listIncidents, logIncident } from "@backend/services/hostel.service";
import { ok, badRequest, unauthorized, handleApiError } from "@/lib/http";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  try {
    return ok(await listIncidents());
  } catch (e) {
    return handleApiError(e);
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const body = await request.json().catch(() => ({}));
  if (!body.description?.trim()) return badRequest({ description: ["Description is required"] });
  try {
    return ok(await logIncident(user, { studentId: body.studentId, roomId: body.roomId, description: body.description.trim() }), 201);
  } catch (e) {
    return handleApiError(e);
  }
}
