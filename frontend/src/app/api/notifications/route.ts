import { getCurrentUser } from "@backend/auth/cookies";
import { listNotifications, countUnreadNotifications } from "@backend/services/notification.service";
import { ok, unauthorized, handleApiError } from "@/lib/http";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const [notifications, unreadCount] = await Promise.all([
      listNotifications(user.id),
      countUnreadNotifications(user.id),
    ]);
    return ok({ notifications, unreadCount });
  } catch (error) {
    return handleApiError(error);
  }
}
