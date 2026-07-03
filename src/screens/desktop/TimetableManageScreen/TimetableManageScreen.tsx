/**
 * TimetableManageScreen — desktop view for managing timetable slots.
 */
import { Card } from "@/components/ui/Card";
import { TimetableSlotForm } from "@/components/modules/timetable/TimetableSlotForm";
import { getClasses, getSubjects } from "@backend/services/dashboard.service";
import styles from "./TimetableManageScreen.module.css";

export const dynamic = "force-dynamic";

export async function TimetableManageScreen() {
  const [classes, subjects] = await Promise.all([getClasses(), getSubjects()]);
  return (
    <div className={styles.root}>
      <section className="mb-6">
        <p className="label-sm text-emerald">Academic Planning</p>
        <h1 className="font-heading text-[32px] font-semibold leading-10 text-navy">Manage Timetable</h1>
      </section>
      <Card>
        <TimetableSlotForm classes={classes} subjects={subjects} />
      </Card>
    </div>
  );
}