import { otpRequestSchema } from "@backend/validation/auth";
import { requestPasswordResetOtp } from "@backend/services/otp.service";
import { ok, fail, handleApiError } from "@/lib/http";

export async function POST(request: Request) {
  try {
    const body = otpRequestSchema.parse(await request.json());
    const { devCode } = await requestPasswordResetOtp(body.phone);
    return ok({ ok: true, ...(devCode ? { devCode } : {}) });
  } catch (error) {
    if (error instanceof Error && error.message === "Too many requests. Please try again later.") {
      return fail(error.message, 429);
    }
    return handleApiError(error);
  }
}
