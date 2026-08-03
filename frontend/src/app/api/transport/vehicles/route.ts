import { type NextRequest } from "next/server";
import { getCurrentUser } from "@backend/auth/cookies";
import { listVehicles, createVehicle } from "@backend/services/transport.service";
import { ok, badRequest, unauthorized, handleApiError } from "@/lib/http";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  try {
    return ok(await listVehicles());
  } catch (e) {
    return handleApiError(e);
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const body = await request.json().catch(() => ({}));
  const { regNo, make, capacity, type, driverId } = body;
  if (!regNo?.trim() || !make?.trim() || typeof capacity !== "number" || !type?.trim()) {
    return badRequest({ message: ["regNo, make, capacity, and type are required"] });
  }
  try {
    return ok(await createVehicle(user, { regNo: regNo.trim(), make: make.trim(), capacity, type: type.trim(), driverId: driverId || null }), 201);
  } catch (e) {
    return handleApiError(e);
  }
}
