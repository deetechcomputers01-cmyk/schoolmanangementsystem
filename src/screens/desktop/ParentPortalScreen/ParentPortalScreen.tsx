/**
 * ParentPortalScreen — desktop view for the Parent/Guardian Portal.
 */
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/cookies";
import { getGuardianPortalData } from "@/lib/services/portal.service";
import { GuardianPortal } from "@/components/modules/portal/GuardianPortal";
import styles from "./ParentPortalScreen.module.css";

export const dynamic = "force-dynamic";

export async function ParentPortalScreen() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const data = await getGuardianPortalData(user.id).catch(() => null);
  return (
    <div className={styles.root}>
      {data ? (
        <GuardianPortal data={data} />
      ) : (
        <NoLinkNotice />
      )}
    </div>
  );
}

function NoLinkNotice() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-amber/10 text-3xl text-amber">[!]</div>
      <h2 className="font-heading text-xl font-semibold text-navy">Account not linked yet</h2>
      <p className="mt-2 max-w-sm text-sm text-muted">
        Your parent account has not been linked to a child record. Please contact the school office.
      </p>
    </div>
  );
}