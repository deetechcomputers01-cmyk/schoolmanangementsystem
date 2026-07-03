import { getCurrentUser } from "@backend/auth/cookies";
import { handleApiError, ok } from "@/lib/http";
import { createFee, listFees } from "@backend/services/fee.service";
import { feeSchema } from "@backend/validation/fees";

export async function GET() {
  try {
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
