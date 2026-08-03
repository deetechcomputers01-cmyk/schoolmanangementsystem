import { type NextRequest } from "next/server";
import { getCurrentUser } from "@backend/auth/cookies";
import { prisma } from "@backend/prisma";
import { sickVisitUpdateSchema } from "@backend/validation/health";
import { ok, unauthorized, forbidden, handleApiError } from "@/lib/http";

const HEALTH_ROLES = ["super_admin", "principal", "staff"];

export async function PATCH(
  request: NextRequest,
  { params }: { params: { studentId: string; visitId: string } },
) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (!HEALTH_ROLES.includes(user.role)) return forbidden();
  try {
    const data = sickVisitUpdateSchema.parse(await request.json());
    const visit = await prisma.sickVisit.update({
      where: { id: params.visitId },
      data,
    });
    return ok(visit);
  } catch (e) {
    return handleApiError(e);
  }
}
