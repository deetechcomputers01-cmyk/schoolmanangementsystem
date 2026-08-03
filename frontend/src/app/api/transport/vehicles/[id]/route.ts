import { type NextRequest } from "next/server";
import { getCurrentUser } from "@backend/auth/cookies";
import { updateVehicle } from "@backend/services/transport.service";
import { ok, unauthorized, handleApiError } from "@/lib/http";

export const runtime = "nodejs";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const body = await request.json().catch(() => ({}));
  try {
    return ok(await updateVehicle(user, params.id, body));
  } catch (e) {
    return handleApiError(e);
  }
}
