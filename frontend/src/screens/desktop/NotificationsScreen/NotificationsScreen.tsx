import { redirect } from "next/navigation";
import { getCurrentUser } from "@backend/auth/cookies";
import { listNotifications, countUnreadNotifications } from "@backend/services/notification.service";
import { NotificationsContent } from "./NotificationsContent";
import { MobileNotificationsContent } from "@/screens/mobile/MobileNotificationsContent/MobileNotificationsContent";

export const dynamic = "force-dynamic";

export async function NotificationsScreen() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [notifications, unreadCount] = await Promise.all([
    listNotifications(user.id, 100),
    countUnreadNotifications(user.id),
  ]);

  const props = {
    initialNotifications: notifications.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      body: n.body,
      link: n.link,
      isRead: n.isRead,
      createdAt: n.createdAt.toISOString(),
    })),
    initialUnreadCount: unreadCount,
  };

  return (
    <>
      <div className="mobileOnly">
        <MobileNotificationsContent {...props} />
      </div>
      <div className="desktopOnly">
        <NotificationsContent {...props} />
      </div>
    </>
  );
}
