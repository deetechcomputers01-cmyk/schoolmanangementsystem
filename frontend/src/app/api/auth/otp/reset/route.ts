import { otpResetSchema } from "@backend/validation/auth";
import { resetPasswordWithToken } from "@backend/services/otp.service";
import { getPasswordResetUserId, clearPasswordResetCookie } from "@backend/auth/cookies";
import { ok, unauthorized, handleApiError } from "@/lib/http";

export async function POST(request: Request) {
  try {
    const userId = await getPasswordResetUserId();
    if (!userId) return unauthorized();

    const body = otpResetSchema.parse(await request.json());
    await resetPasswordWithToken(userId, body.newPassword);
    clearPasswordResetCookie();
    return ok({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
