/**
 * AttendanceReportsScreen — desktop view for Attendance Reports.
 */
import { Badge } from "@/components/ui/Badge";
import { Table } from "@/components/ui/Table";
import { listAttendance } from "@backend/services/attendance.service";
import styles from "./AttendanceReportsScreen.module.css";

export const dynamic = "force-dynamic";

export async function AttendanceReportsScreen() {
  const rows = await listAttendance();
  return (
    <div className={styles.root}>
      <section className="mb-6">
        <p className="label-sm text-emerald">Daily Register</p>
        <h1 className="font-heading text-[32px] font-semibold leading-10 text-navy">Attendance Reports</h1>
      </section>
      <Table>
        <thead className="label-sm bg-slate-100 text-left text-muted">
          <tr>
            <th className="px-4 py-3">Student</th><th className="px-4 py-3">Class</th>
            <th className="px-4 py-3">Date</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Note</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-shell">
              <td className="px-4 py-3 font-heading font-semibold text-navy">{row.student.firstName} {row.student.lastName}</td>
              <td className="px-4 py-3 text-muted">{row.student.class.name}</td>
              <td className="font-data px-4 py-3 text-muted">{row.date.toDateString()}</td>
              <td className="px-4 py-3">
                <Badge tone={row.status === "present" ? "success" : row.status === "late" ? "warning" : "danger"}>{row.status}</Badge>
              </td>
              <td className="px-4 py-3 text-muted">{row.note ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}