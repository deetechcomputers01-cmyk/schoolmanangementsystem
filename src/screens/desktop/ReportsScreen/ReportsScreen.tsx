/**
 * ReportsScreen — desktop view for the Reports module.
 */
import { BarChart3, Banknote, CalendarCheck, GraduationCap } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import { currency } from "@/lib/utils";
import { listAttendance } from "@/lib/services/attendance.service";
import { listFees } from "@/lib/services/fee.service";
import { listGrades } from "@/lib/services/grade.service";
import { listStudents } from "@/lib/services/student.service";
import styles from "./ReportsScreen.module.css";

export const dynamic = "force-dynamic";

export async function ReportsScreen() {
  const [students, attendance, grades, fees] = await Promise.all([
    listStudents(), listAttendance(), listGrades(), listFees(),
  ]);
  const present = attendance.filter((r) => r.status === "present").length;
  const collected = fees.reduce(
    (sum, fee) => sum + fee.payments.reduce((inner, p) => inner + Number(p.amount), 0), 0,
  );
  const average = grades.length ? Math.round(grades.reduce((sum, g) => sum + g.score, 0) / grades.length) : 0;
  return (
    <div className={styles.root}>
      <section className="mb-6">
        <p className="label-sm text-emerald">Analytics</p>
        <h1 className="font-heading text-[32px] font-semibold leading-10 text-navy">Reports</h1>
        <p className="text-muted">Academic, attendance, and finance reporting for the current term.</p>
      </section>
      <section className="mb-6 grid gap-4 md:grid-cols-4">
        <ReportCard icon={<GraduationCap />} label="Students" value={students.length.toString()} />
        <ReportCard icon={<CalendarCheck />} label="Attendance Records" value={attendance.length.toString()} />
        <ReportCard icon={<BarChart3 />} label="Average Score" value={`${average}%`} />
        <ReportCard icon={<Banknote />} label="Fees Collected" value={currency(collected)} />
      </section>
      <Table>
        <thead className="label-sm bg-slate-100 text-left text-muted">
          <tr><th className="px-4 py-3">Report</th><th className="px-4 py-3">Scope</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Updated</th></tr>
        </thead>
        <tbody className="divide-y divide-line">
          <tr className="hover:bg-shell"><td className="px-4 py-3 font-semibold text-navy">Attendance Summary</td><td className="px-4 py-3 text-muted">All classes</td><td className="px-4 py-3 text-emerald font-semibold">Ready</td><td className="font-data px-4 py-3 text-muted">{new Date().toDateString()}</td></tr>
          <tr className="hover:bg-shell"><td className="px-4 py-3 font-semibold text-navy">Fee Collection</td><td className="px-4 py-3 text-muted">Current term</td><td className="px-4 py-3 text-emerald font-semibold">Ready</td><td className="font-data px-4 py-3 text-muted">{new Date().toDateString()}</td></tr>
          <tr className="hover:bg-shell"><td className="px-4 py-3 font-semibold text-navy">Grade Report</td><td className="px-4 py-3 text-muted">All subjects</td><td className="px-4 py-3 text-emerald font-semibold">Ready</td><td className="font-data px-4 py-3 text-muted">{new Date().toDateString()}</td></tr>
        </tbody>
      </Table>
    </div>
  );
}

function ReportCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card className="flex items-center gap-4">
      <span className="grid h-10 w-10 place-items-center rounded-lg bg-navy/5 text-navy">{icon}</span>
      <div><p className="label-sm text-muted">{label}</p><p className="font-data text-2xl font-semibold text-navy">{value}</p></div>
    </Card>
  );
}