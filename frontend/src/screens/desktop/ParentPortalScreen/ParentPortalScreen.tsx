import { redirect } from "next/navigation";
import { getCurrentUser } from "@backend/auth/cookies";
import { getGuardianPortalData } from "@backend/services/portal.service";
import { ParentPortalContent } from "./ParentPortalContent";
import styles from "./ParentPortalScreen.module.css";

export const dynamic = "force-dynamic";

export async function ParentPortalScreen() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const data = await getGuardianPortalData(user.id).catch(() => null);

  if (!data) {
    return (
      <div className={styles.noLink}>
        <div className={styles.noLinkIcon}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <line x1="23" y1="11" x2="17" y2="11"/>
          </svg>
        </div>
        <h2 className={styles.noLinkTitle}>Account not linked yet</h2>
        <p className={styles.noLinkText}>
          Your parent account has not been linked to a child record.<br />
          Please contact the school office.
        </p>
      </div>
    );
  }

  return <ParentPortalContent data={data} guardianName={user.name} />;
}
