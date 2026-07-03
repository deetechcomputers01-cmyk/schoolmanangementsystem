import { type NextRequest } from "next/server";
import { getCurrentUser } from "@backend/auth/cookies";
import { listAcademicYears, createAcademicYear } from "@backend/services/academic.service";
import { academicYearSchema } from "@backend/validation/academic";
import { ok, badRequest, forbidden, unauthorized } from "@/lib/http";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const years = await listAcademicYears();
  return ok(years);
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (user.role !== "super_admin" && user.role !== "principal") return forbidden();

  const body = await request.json();
  const parsed = academicYearSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.flatten().fieldErrors);

  const year = await createAcademicYear(user, parsed.data);
  return ok(year, 201);
}
