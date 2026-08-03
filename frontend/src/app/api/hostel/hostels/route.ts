import { type NextRequest } from "next/server";
import { getCurrentUser } from "@backend/auth/cookies";
import { listHostels, createHostel } from "@backend/services/hostel.service";
import { ok, badRequest, unauthorized, handleApiError } from "@/lib/http";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  try {
    return ok(await listHostels());
  } catch (e) {
    return handleApiError(e);
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const body = await request.json().catch(() => ({}));
  if (!body.name?.trim()) return badRequest({ name: ["Name is required"] });
  try {
    return ok(await createHostel(user, body.name.trim()), 201);
  } catch (e) {
    return handleApiError(e);
  }
}
