import { getCurrentUser } from "@/lib/auth/cookies";
import { fail, handleApiError, ok } from "@/lib/http";
import { getStaff, removeStaff, updateStaff } from "@/lib/services/staff.service";
import { staffSchema } from "@/lib/validation/staff";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const staff = await getStaff(params.id);
    if (!staff) return fail("Staff not found", 404);
    return ok({ staff });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    const body = staffSchema.partial().parse(await request.json());
    return ok({ staff: await updateStaff(user, params.id, body) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    return ok({ staff: await removeStaff(user, params.id) });
  } catch (error) {
    return handleApiError(error);
  }
}
