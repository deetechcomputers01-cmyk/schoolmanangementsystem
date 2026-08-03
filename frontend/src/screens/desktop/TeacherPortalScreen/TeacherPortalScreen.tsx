import { redirect } from "next/navigation";
import { getCurrentUser } from "@backend/auth/cookies";
import { getTeacherDashboardData } from "@backend/services/portal.service";
import { TeacherPortal } from "@/components/modules/portal/TeacherPortal";
import styles from "./TeacherPortalScreen.module.css";

export const dynamic = "force-dynamic";

export async function TeacherPortalScreen() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const data = await getTeacherDashboardData(user.id).catch(() => null);
  return (
    <div className={styles.root}>
      {data ? (
        <TeacherPortal data={data} />
      ) : (
        <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
          <div className="mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-amber/10 text-3xl text-amber">[!]</div>
          <h2 className="text-xl font-semibold text-on-surface">Staff record not found</h2>
          <p className="mt-2 max-w-sm text-sm text-muted">
            Your account is not linked to a staff record. Contact the school administrator.
          </p>
        </div>
      )}
    </div>
  );
}
