import { getCurrentUser } from "@/lib/auth/cookies";
import { handleApiError, ok } from "@/lib/http";
import { createStaff, listStaff } from "@/lib/services/staff.service";
import { staffSchema } from "@/lib/validation/staff";

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
