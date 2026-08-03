import { type NextRequest } from "next/server";
import { getCurrentUser } from "@backend/auth/cookies";
import { updateVehicleLocation } from "@backend/services/transport.service";
import { ok, badRequest, unauthorized, handleApiError } from "@/lib/http";

export const runtime = "nodejs";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const body = await request.json().catch(() => ({}));
  const { latitude, longitude, heading, speed } = body;
  if (typeof latitude !== "number" || typeof longitude !== "number") {
    return badRequest({ message: ["latitude and longitude are required"] });
  }
  try {
    const vehicle = await updateVehicleLocation(user, params.id, { latitude, longitude, heading, speed });
    return ok(vehicle);
  } catch (e) {
    return handleApiError(e);
  }
}
