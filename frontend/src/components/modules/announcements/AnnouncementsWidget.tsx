import Link from "next/link";
import { listAnnouncements } from "@backend/services/announcement.service";
import { Bell, Pin } from "lucide-react";
import styles from "./AnnouncementsWidget.module.css";

export async function AnnouncementsWidget({
  role,
  showHeader = true,
}: {
  role: string;
  showHeader?: boolean;
}) {
  const list = await listAnnouncements(role);
  const items = list.slice(0, 3);

  if (items.length === 0) return null;

  return (
    <section className={styles.widget}>
      {showHeader ? (
        <div className={styles.header}>
          <h2 className={styles.title}>
            <Bell size={16} className={styles.titleIcon} />
            Announcements
          </h2>
          <Link href="/announcements" className={styles.link}>
            View All
          </Link>
        </div>
      ) : null}
      <div className={styles.list}>
        {items.map((ann) => (
          <article key={ann.id} className={`${styles.card} ${ann.isPinned ? styles.cardPinned : ""}`}>
            <div className={styles.cardTop}>
              <div className={styles.copy}>
                {ann.isPinned ? (
                  <span className={styles.label}>
                    <Pin size={11} />
                    Pinned
                  </span>
                ) : null}
                <p className={styles.cardTitle}>{ann.title}</p>
                <p className={styles.body}>{ann.body}</p>
              </div>
            </div>
            <div className={styles.meta}>
              <span>
                Published{" "}
                <span className={styles.metaStrong}>
                  {new Date(ann.publishedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                </span>
              </span>
              <span>{ann.audience.length > 0 ? `${ann.audience.length} audience group${ann.audience.length > 1 ? "s" : ""}` : "Everyone"}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
