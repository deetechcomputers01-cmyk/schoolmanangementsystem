import { otpVerifySchema } from "@backend/validation/auth";
import { verifyPasswordResetOtp } from "@backend/services/otp.service";
import { setPasswordResetCookie } from "@backend/auth/cookies";
import { ok, fail, handleApiError } from "@/lib/http";

export async function POST(request: Request) {
  try {
    const body = otpVerifySchema.parse(await request.json());
    const userId = await verifyPasswordResetOtp(body.phone, body.code);
    await setPasswordResetCookie(userId);
    return ok({ ok: true });
  } catch (error) {
    if (error instanceof Error && /Invalid|Too many attempts/.test(error.message)) {
      return fail(error.message, 400);
    }
    return handleApiError(error);
  }
}
