import { getCurrentUser } from "@backend/auth/cookies";
import { markAllNotificationsRead } from "@backend/services/notification.service";
import { ok, unauthorized, handleApiError } from "@/lib/http";

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    await markAllNotificationsRead(user.id);
    return ok({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
