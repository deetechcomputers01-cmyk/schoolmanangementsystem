import { type NextRequest } from "next/server";
import { getCurrentUser } from "@backend/auth/cookies";
import { listMovements, recordMovement } from "@backend/services/asset.service";
import { ok, badRequest, unauthorized, handleApiError } from "@/lib/http";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  try {
    return ok(await listMovements());
  } catch (e) {
    return handleApiError(e);
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const body = await request.json().catch(() => ({}));
  const { assetId, type, quantity, note } = body;
  if (!assetId || !["issue", "receive", "transfer", "adjustment"].includes(type) || typeof quantity !== "number" || quantity <= 0) {
    return badRequest({ message: ["assetId, a valid type, and a positive quantity are required"] });
  }
  try {
    return ok(await recordMovement(user, { assetId, type, quantity, note }), 201);
  } catch (e) {
    return handleApiError(e);
  }
}
