/**
 * AnnouncementsScreen — desktop view for Announcements.
 */
import { getCurrentUser } from "@backend/auth/cookies";
import { listAnnouncements, listAllAnnouncements } from "@backend/services/announcement.service";
import { AnnouncementsClient } from "@/components/modules/announcements/AnnouncementsClient";
import { MobileAnnouncementsContent } from "@/screens/mobile/MobileAnnouncementsContent/MobileAnnouncementsContent";
import styles from "./AnnouncementsScreen.module.css";

export const dynamic = "force-dynamic";

export async function AnnouncementsScreen() {
  const user = await getCurrentUser();
  const canManage = user?.role === "super_admin" || user?.role === "principal";
  const list = canManage ? await listAllAnnouncements() : await listAnnouncements(user?.role);
  return (
    <div className={styles.root}>
      <div className="mobileOnly">
        <MobileAnnouncementsContent initialList={list} canManage={canManage} />
      </div>
      <div className="desktopOnly">
        <AnnouncementsClient initialList={list} canManage={canManage} currentRole={user?.role ?? ""} />
      </div>
    </div>
  );
}