import { type NextRequest } from "next/server";
import { getCurrentUser } from "@backend/auth/cookies";
import { createRoom } from "@backend/services/hostel.service";
import { ok, badRequest, unauthorized, handleApiError } from "@/lib/http";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const body = await request.json().catch(() => ({}));
  const { hostelId, name, capacity } = body;
  if (!hostelId || !name?.trim() || typeof capacity !== "number") {
    return badRequest({ message: ["hostelId, name, and capacity are required"] });
  }
  try {
    return ok(await createRoom(user, { hostelId, name: name.trim(), capacity }), 201);
  } catch (e) {
    return handleApiError(e);
  }
}
