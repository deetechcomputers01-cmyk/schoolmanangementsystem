import { type NextRequest } from "next/server";
import { getCurrentUser } from "@backend/auth/cookies";
import { addVaccination } from "@backend/services/health.service";
import { vaccinationSchema } from "@backend/validation/health";
import { ok, unauthorized, forbidden, handleApiError } from "@/lib/http";

const HEALTH_ROLES = ["super_admin", "principal", "staff"];

export async function POST(request: NextRequest, { params }: { params: { studentId: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (!HEALTH_ROLES.includes(user.role)) return forbidden();
  try {
    const data = vaccinationSchema.parse(await request.json());
    return ok(await addVaccination(user, params.studentId, data), 201);
  } catch (e) {
    return handleApiError(e);
  }
}
