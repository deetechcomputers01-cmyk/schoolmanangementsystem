/**
 * AdmissionsScreen — desktop view for Admissions.
 */
import { getCurrentUser } from "@/lib/auth/cookies";
import { listApplications } from "@/lib/services/admission.service";
import { AdmissionsClient } from "@/components/modules/admissions/AdmissionsClient";
import { prisma } from "@/lib/prisma";
import styles from "./AdmissionsScreen.module.css";

export const dynamic = "force-dynamic";

export async function AdmissionsScreen() {
  const [user, applications, classes] = await Promise.all([
    getCurrentUser(),
    listApplications(),
    prisma.class.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  const canReview = user?.role === "super_admin" || user?.role === "principal";
  return (
    <div className={styles.root}>
      <AdmissionsClient initialList={applications} classes={classes} canReview={canReview} canCreate={!!user} />
    </div>
  );
}