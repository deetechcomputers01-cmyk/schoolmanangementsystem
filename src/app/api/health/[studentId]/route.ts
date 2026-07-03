import { type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/cookies";
import { getHealthRecord, upsertHealthRecord } from "@/lib/services/health.service";
import { ok, unauthorized, notFound } from "@/lib/http";

export async function GET(_req: NextRequest, { params }: { params: { studentId: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const record = await getHealthRecord(params.studentId);
  return record ? ok(record) : notFound();
}

export async function PATCH(request: NextRequest, { params }: { params: { studentId: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const data = await request.json();
  return ok(await upsertHealthRecord(user, params.studentId, data));
}
