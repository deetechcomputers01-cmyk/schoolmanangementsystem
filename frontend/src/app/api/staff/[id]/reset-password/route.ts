import { getCurrentUser } from "@backend/auth/cookies";
import { fail, handleApiError, ok } from "@/lib/http";
import { getStaff } from "@backend/services/staff.service";
import { resetUserPassword } from "@backend/services/auth.service";

export const runtime = "nodejs";

export async function POST(_: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    const staff = await getStaff(params.id);
    if (!staff) return fail("Staff not found", 404);
    if (!staff.userId) return fail("This staff member has no login account.", 400);

    const tempPassword = await resetUserPassword(user, staff.userId);
    return ok({ tempPassword });
  } catch (error) {
    return handleApiError(error);
  }
}
