/**
 * StudentPortalScreen — desktop view for the Student Portal.
 */
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/cookies";
import { getStudentPortalData } from "@/lib/services/portal.service";
import { StudentPortal } from "@/components/modules/portal/StudentPortal";
import styles from "./StudentPortalScreen.module.css";

export const dynamic = "force-dynamic";

export async function StudentPortalScreen() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const data = await getStudentPortalData(user.id).catch(() => null);
  return (
    <div className={styles.root}>
      {data ? (
        <StudentPortal data={data} />
      ) : (
        <NoLinkNotice role="student" />
      )}
    </div>
  );
}

function NoLinkNotice({ role }: { role: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-amber/10 text-3xl text-amber">[!]</div>
      <h2 className="font-heading text-xl font-semibold text-navy">Account not linked yet</h2>
      <p className="mt-2 max-w-sm text-sm text-muted">
        Your {role} account has not been linked to a student record. Please contact the school office.
      </p>
    </div>
  );
}