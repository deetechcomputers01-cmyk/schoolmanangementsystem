import { getCurrentUser } from "@/lib/auth/cookies";
import { handleApiError, ok } from "@/lib/http";
import { createFee, listFees } from "@/lib/services/fee.service";
import { feeSchema } from "@/lib/validation/fees";

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
