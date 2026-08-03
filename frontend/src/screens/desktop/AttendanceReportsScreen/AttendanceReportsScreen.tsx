import { listAttendance } from "@backend/services/attendance.service";
import { requireRole } from "@backend/auth/page-guard";
import { getSettings } from "@backend/services/settings.service";
import { AttendanceReportsContent } from "./AttendanceReportsContent";

export const dynamic = "force-dynamic";

export type AbsenteeRow = {
  studentId: string;
  studentName: string;
  admissionNo: string;
  className: string;
  daysAbsent: number;
  consecutiveDays: number;
  status: "Critical" | "Monitor" | "Standard" | "Perfect";
  recentAbsences: { date: string; reason: string | null }[];
};

export type WeeklyPoint = { week: string; pct: number };
export type ClassBar   = { label: string; pct: number };

export async function AttendanceReportsScreen() {
  await requireRole("super_admin", "principal", "staff");
  const [rows, settings] = await Promise.all([listAttendance(), getSettings()]);
  const ex = (settings.extra ?? {}) as Record<string, unknown>;
  const minAttendanceRate = Number(ex.minAttendanceRate ?? 75);
  const alertThreshold    = Number(ex.alertThreshold    ?? 60);

  const total    = rows.length;
  const present  = rows.filter(r => r.status === "present").length;
  const absent   = rows.filter(r => r.status === "absent").length;
  const late     = rows.filter(r => r.status === "late").length;
  const excused  = rows.filter(r => r.status === "excused").length;
  const overallPct = total > 0
    ? Math.round(((present + excused) / total) * 1000) / 10
    : 0;

  // Group by student — track every record (not just absences) so we can compute
  // each student's real attendance rate against the live Settings thresholds.
  const studentMap = new Map<string, {
    studentId: string;
    studentName: string;
    admissionNo: string;
    className: string;
    totalRecords: number;
    absences: { date: Date; note: string | null }[];
  }>();

  rows.forEach(r => {
    const key = `${r.student.firstName}-${r.student.lastName}-${r.student.admissionNo}`;
    if (!studentMap.has(key)) {
      studentMap.set(key, {
        studentId: r.student.admissionNo,
        studentName: `${r.student.firstName} ${r.student.lastName}`,
        admissionNo: r.student.admissionNo,
        className: r.student.class.name,
        totalRecords: 0,
        absences: [],
      });
    }
    const entry = studentMap.get(key)!;
    entry.totalRecords++;
    if (r.status === "absent") {
      entry.absences.push({ date: r.date, note: r.note ?? null });
    }
  });

  const topAbsentees: AbsenteeRow[] = Array.from(studentMap.values())
    .filter(s => s.absences.length > 0)
    .sort((a, b) => b.absences.length - a.absences.length)
    .slice(0, 8)
    .map(s => {
      const sorted = [...s.absences].sort((a, b) => b.date.getTime() - a.date.getTime());
      let consecutive = 1;
      for (let i = 1; i < sorted.length; i++) {
        const diffMs = sorted[i - 1].date.getTime() - sorted[i].date.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        if (diffDays <= 2) consecutive++; else break;
      }
      const d = s.absences.length;
      const studentRate = s.totalRecords > 0 ? ((s.totalRecords - d) / s.totalRecords) * 100 : 100;
      const status: AbsenteeRow["status"] =
        studentRate < alertThreshold ? "Critical" :
        studentRate < minAttendanceRate ? "Monitor" : "Standard";
      return {
        studentId: s.studentId,
        studentName: s.studentName,
        admissionNo: s.admissionNo,
        className: s.className,
        daysAbsent: d,
        consecutiveDays: Math.min(consecutive, d),
        status,
        recentAbsences: sorted.slice(0, 3).map(a => ({
          date: a.date.toISOString(),
          reason: a.note,
        })),
      };
    });

  // Weekly attendance trend (last 4 weeks)
  const now = new Date();
  const weeklyData: WeeklyPoint[] = [1, 2, 3, 4].map(w => {
    const wEnd   = new Date(now);
    wEnd.setDate(now.getDate() - (4 - w) * 7);
    const wStart = new Date(wEnd);
    wStart.setDate(wEnd.getDate() - 7);
    const wRows = rows.filter(r => r.date >= wStart && r.date < wEnd);
    const pct = wRows.length > 0
      ? Math.round((wRows.filter(r => r.status === "present").length / wRows.length) * 100)
      : 0;
    return { week: `W${w}`, pct };
  });

  // Class comparison
  const classMap = new Map<string, { present: number; total: number }>();
  rows.forEach(r => {
    const cls = r.student.class.name;
    const e = classMap.get(cls) ?? { present: 0, total: 0 };
    e.total++;
    if (r.status === "present") e.present++;
    classMap.set(cls, e);
  });
  const classData: ClassBar[] = Array.from(classMap.entries())
    .map(([label, { present: p, total: t }]) => ({
      label,
      pct: t > 0 ? Math.round((p / t) * 100) : 0,
    }))
    .sort((a, b) => a.label.localeCompare(b.label))
    .slice(0, 6);

  return (
    <AttendanceReportsContent
      overallPct={overallPct}
      presentCount={present}
      absentCount={absent}
      lateCount={late}
      excusedCount={excused}
      totalRecords={total}
      topAbsentees={topAbsentees}
      weeklyData={weeklyData}
      classData={classData}
    />
  );
}
