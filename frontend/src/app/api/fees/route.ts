import { getCurrentUser } from "@backend/auth/cookies";
import { handleApiError, ok, unauthorized, forbidden } from "@/lib/http";
import { createFee, listFees } from "@backend/services/fee.service";
import { feeSchema } from "@backend/validation/fees";

const FEES_READ_ROLES = ["super_admin", "principal", "staff"];

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    if (!FEES_READ_ROLES.includes(user.role)) return forbidden();
    return ok({ fees: await listFees() });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const body = feeSchema.parse(await request.json());
    return ok({ fee: await createFee(user, body) }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
