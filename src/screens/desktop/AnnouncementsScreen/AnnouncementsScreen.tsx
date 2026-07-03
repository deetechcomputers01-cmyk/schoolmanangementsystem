/**
 * AnnouncementsScreen — desktop view for Announcements.
 */
import { getCurrentUser } from "@/lib/auth/cookies";
import { listAnnouncements, listAllAnnouncements } from "@/lib/services/announcement.service";
import { AnnouncementsClient } from "@/components/modules/announcements/AnnouncementsClient";
import styles from "./AnnouncementsScreen.module.css";

export const dynamic = "force-dynamic";

export async function AnnouncementsScreen() {
  const user = await getCurrentUser();
  const canManage = user?.role === "super_admin" || user?.role === "principal";
  const list = canManage ? await listAllAnnouncements() : await listAnnouncements(user?.role);
  return (
    <div className={styles.root}>
      <section className="mb-6">
        <p className="label-sm text-emerald">Communications</p>
        <h1 className="font-heading text-[32px] font-semibold leading-10 text-navy">Announcements</h1>
      </section>
      <AnnouncementsClient initialList={list} canManage={canManage} currentRole={user?.role ?? ""} />
    </div>
  );
}