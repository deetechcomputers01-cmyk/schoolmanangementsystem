import { getCurrentUser } from "@backend/auth/cookies";
import { markNotificationRead } from "@backend/services/notification.service";
import { ok, unauthorized, handleApiError } from "@/lib/http";

export async function PATCH(_: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const notification = await markNotificationRead(user, params.id);
    return ok({ notification });
  } catch (error) {
    return handleApiError(error);
  }
}
