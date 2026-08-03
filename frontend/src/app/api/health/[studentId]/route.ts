import { type NextRequest } from "next/server";
import { getCurrentUser } from "@backend/auth/cookies";
import { getHealthRecord, upsertHealthRecord } from "@backend/services/health.service";
import { healthRecordSchema } from "@backend/validation/health";
import { ok, unauthorized, forbidden, notFound, handleApiError } from "@/lib/http";

const HEALTH_ROLES = ["super_admin", "principal", "staff"];

export async function GET(_req: NextRequest, { params }: { params: { studentId: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (!HEALTH_ROLES.includes(user.role)) return forbidden();
  const record = await getHealthRecord(params.studentId);
  return record ? ok(record) : notFound();
}

export async function PATCH(request: NextRequest, { params }: { params: { studentId: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (!HEALTH_ROLES.includes(user.role)) return forbidden();
  try {
    const data = healthRecordSchema.parse(await request.json());
    return ok(await upsertHealthRecord(user, params.studentId, data));
  } catch (e) {
    return handleApiError(e);
  }
}
