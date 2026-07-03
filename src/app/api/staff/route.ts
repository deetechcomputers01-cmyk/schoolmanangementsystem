import { getCurrentUser } from "@backend/auth/cookies";
import { handleApiError, ok } from "@/lib/http";
import { createStaff, listStaff } from "@backend/services/staff.service";
import { staffSchema } from "@backend/validation/staff";

export async function GET() {
  try {
    return ok({ staff: await listStaff() });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const body = staffSchema.parse(await request.json());
    return ok({ staff: await createStaff(user, body) }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
