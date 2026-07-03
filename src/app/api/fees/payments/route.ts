import { getCurrentUser } from "@/lib/auth/cookies";
import { handleApiError, ok } from "@/lib/http";
import { createPayment } from "@/lib/services/fee.service";
import { paymentSchema } from "@/lib/validation/fees";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const body = paymentSchema.parse(await request.json());
    return ok({ payment: await createPayment(user, body) }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
