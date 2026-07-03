/**
 * AcademicCalendarScreen — desktop view for Academic Calendar.
 */
import { getCurrentUser } from "@backend/auth/cookies";
import { listAcademicYears } from "@backend/services/academic.service";
import { AcademicCalendarClient } from "@/components/modules/academic/AcademicCalendarClient";
import styles from "./AcademicCalendarScreen.module.css";

export const dynamic = "force-dynamic";

export async function AcademicCalendarScreen() {
  const [years, user] = await Promise.all([listAcademicYears(), getCurrentUser()]);
  const canManage = user?.role === "super_admin" || user?.role === "principal";
  return (
    <div className={styles.root}>
      <section className="mb-6">
        <p className="label-sm text-emerald">Academic Planning</p>
        <h1 className="font-heading text-[32px] font-semibold leading-10 text-navy">Academic Calendar</h1>
        <p className="text-muted">Manage academic years, terms, and key dates.</p>
      </section>
      <AcademicCalendarClient initialYears={years} canManage={canManage} />
    </div>
  );
}