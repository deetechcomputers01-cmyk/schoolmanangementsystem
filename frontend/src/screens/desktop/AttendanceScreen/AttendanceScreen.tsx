/**
 * AttendanceScreen — desktop view for Attendance marking.
 */
import Link from "next/link";
import { BarChart3 } from "lucide-react";
import { AttendanceGrid } from "@/components/modules/attendance/AttendanceGrid";
import { AttendanceSummary } from "@/components/modules/attendance/AttendanceSummary";
import { Button } from "@/components/ui/Button";
import { listAttendance } from "@backend/services/attendance.service";
import { getClasses } from "@backend/services/dashboard.service";
import { listStudents } from "@backend/services/student.service";
import { requireRole } from "@backend/auth/page-guard";
import styles from "./AttendanceScreen.module.css";

export const dynamic = "force-dynamic";

export async function AttendanceScreen() {
  await requireRole("super_admin", "principal", "teacher");
  const [students, classes, attendance] = await Promise.all([listStudents(), getClasses(), listAttendance()]);
  const classId = classes[0]?.id ?? "";
  // Strip Prisma-only fields (Decimal, nested objects) before crossing server→client boundary
  const classStudents = students
    .filter((s) => s.classId === classId)
    .map(({ id, firstName, lastName, classId: cid }) => ({ id, firstName, lastName, classId: cid }));
  return (
    <div className={styles.root}>
      <section className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <p className="label-sm text-emerald">Daily Register</p>
          <h1 className="font-heading text-[32px] font-semibold leading-10 text-navy">Mark Attendance</h1>
          <p className="text-muted">Offline queue enabled for attendance submissions.</p>
        </div>
        <Link href="/attendance/reports"><Button variant="secondary"><BarChart3 size={18} /> Reports</Button></Link>
      </section>
      <div className="grid gap-6">
        <AttendanceSummary
          present={attendance.filter((r) => r.status === "present").length}
          absent={attendance.filter((r) => r.status === "absent").length}
          late={attendance.filter((r) => r.status === "late").length}
        />
        <AttendanceGrid students={classStudents} classId={classId} />
      </div>
    </div>
  );
}