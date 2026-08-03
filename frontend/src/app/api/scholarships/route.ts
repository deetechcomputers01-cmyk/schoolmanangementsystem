import { type NextRequest } from "next/server";
import { getCurrentUser } from "@backend/auth/cookies";
import { listScholarships, applyScholarship } from "@backend/services/scholarship.service";
import { ok, badRequest, unauthorized, handleApiError } from "@/lib/http";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  try {
    const scholarships = await listScholarships();
    return ok(scholarships);
  } catch (e) {
    return handleApiError(e);
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const body = await request.json().catch(() => ({}));
  const { studentIds, type, value, reason, academicYearId } = body;
  if (!Array.isArray(studentIds) || studentIds.length === 0) return badRequest({ studentIds: ["Select at least one student"] });
  if (type !== "percent" && type !== "fixed") return badRequest({ type: ["Must be 'percent' or 'fixed'"] });
  if (typeof value !== "number") return badRequest({ value: ["Value is required"] });

  try {
    const created = await applyScholarship(user, { studentIds, type, value, reason, academicYearId });
    return ok(created, 201);
  } catch (e) {
    return handleApiError(e);
  }
}
