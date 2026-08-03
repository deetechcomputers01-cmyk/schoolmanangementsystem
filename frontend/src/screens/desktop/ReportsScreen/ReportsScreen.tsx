import { requireRole } from "@backend/auth/page-guard";
import { prisma } from "@backend/prisma";
import { getCurrentAcademicContext } from "@backend/services/academic.service";
import { DEFAULT_GRADING_SCALE, type GradeBand } from "@backend/utils";
import { ReportsContent } from "./ReportsContent";
import { MobileReportsContent } from "@/screens/mobile/MobileReportsContent/MobileReportsContent";

export const dynamic = "force-dynamic";

async function classAverageForTerm(term: string | null) {
  if (!term) return null;
  const agg = await prisma.grade.aggregate({ where: { term }, _avg: { score: true } });
  return agg._avg.score !== null ? Math.round(agg._avg.score * 10) / 10 : null;
}

export async function ReportsScreen() {
  await requireRole("super_admin", "principal", "staff");

  const [context, settings, classes] = await Promise.all([
    getCurrentAcademicContext(),
    prisma.schoolSettings.findUnique({ where: { id: "singleton" } }),
    prisma.class.findMany({ where: { isActive: true }, orderBy: [{ order: { sort: "asc", nulls: "last" } }, { name: "asc" }] }),
  ]);

  const gradingScale = (Array.isArray(settings?.gradingScale) && settings.gradingScale.length > 0
    ? settings.gradingScale
    : DEFAULT_GRADING_SCALE) as unknown as GradeBand[];
  const passCutoff = Math.min(...gradingScale.filter((b) => b.remark?.toLowerCase() !== "fail").map((b) => b.min), 50);

  const currentTermName = context.term?.name ?? null;
  // Previous term within the same academic year, by start date — used for trend deltas.
  const yearTerms = context.year
    ? await prisma.term.findMany({ where: { academicYearId: context.year.id }, orderBy: { startDate: "asc" } })
    : [];
  const currentIdx = yearTerms.findIndex((t) => t.name === currentTermName);
  const previousTermName = currentIdx > 0 ? yearTerms[currentIdx - 1].name : null;

  const [currentGrades, previousAverage, topGrade, students, fees] = await Promise.all([
    currentTermName
      ? prisma.grade.findMany({ where: { term: currentTermName }, include: { subject: true, student: { select: { id: true, classId: true } } } })
      : Promise.resolve([]),
    classAverageForTerm(previousTermName),
    currentTermName
      ? prisma.grade.findFirst({ where: { term: currentTermName }, orderBy: { score: "desc" }, include: { subject: true } })
      : Promise.resolve(null),
    prisma.student.findMany({ select: { id: true, firstName: true, lastName: true, classId: true, class: { select: { name: true } } } }),
    prisma.feeRecord.findMany({ select: { studentId: true, amountDue: true, status: true, payments: { select: { amount: true } } } }),
  ]);

  const classAverage = currentGrades.length
    ? Math.round((currentGrades.reduce((s, g) => s + g.score, 0) / currentGrades.length) * 10) / 10
    : null;
  const trendPts = classAverage !== null && previousAverage !== null ? Math.round((classAverage - previousAverage) * 10) / 10 : null;

  // Subject averages (current term)
  const subjectTotals = new Map<string, { sum: number; count: number }>();
  for (const g of currentGrades) {
    const key = g.subject.name;
    const e = subjectTotals.get(key) ?? { sum: 0, count: 0 };
    e.sum += g.score; e.count += 1;
    subjectTotals.set(key, e);
  }
  const subjectAverages = Array.from(subjectTotals.entries())
    .map(([subject, { sum, count }]) => ({ subject, average: Math.round((sum / count) * 10) / 10 }))
    .sort((a, b) => b.average - a.average);

  // Pass rate + at-risk (current term)
  const passCount = currentGrades.filter((g) => g.score >= passCutoff).length;
  const passRate = currentGrades.length ? Math.round((passCount / currentGrades.length) * 1000) / 10 : null;

  const feeStatusByStudent = new Map<string, boolean>();
  for (const f of fees) {
    const paid = f.payments.reduce((s, p) => s + Number(p.amount), 0);
    const isUnpaid = f.status !== "paid" && paid < Number(f.amountDue);
    if (isUnpaid) feeStatusByStudent.set(f.studentId, true);
  }
  const studentAvgByStudent = new Map<string, { sum: number; count: number }>();
  for (const g of currentGrades) {
    const e = studentAvgByStudent.get(g.student.id) ?? { sum: 0, count: 0 };
    e.sum += g.score; e.count += 1;
    studentAvgByStudent.set(g.student.id, e);
  }
  const atRiskStudentIds = new Set<string>();
  for (const s of students) {
    const gAvg = studentAvgByStudent.get(s.id);
    const belowPass = gAvg ? gAvg.sum / gAvg.count < passCutoff : false;
    if (belowPass || feeStatusByStudent.get(s.id)) atRiskStudentIds.add(s.id);
  }

  // Class performance table (current vs previous term average, per class)
  const classGradesCurrent = new Map<string, { sum: number; count: number }>();
  for (const g of currentGrades) {
    const cid = g.student.classId;
    const e = classGradesCurrent.get(cid) ?? { sum: 0, count: 0 };
    e.sum += g.score; e.count += 1;
    classGradesCurrent.set(cid, e);
  }
  const previousGrades = previousTermName
    ? await prisma.grade.findMany({ where: { term: previousTermName }, include: { student: { select: { classId: true } } } })
    : [];
  const classGradesPrevious = new Map<string, { sum: number; count: number }>();
  for (const g of previousGrades) {
    const cid = g.student.classId;
    const e = classGradesPrevious.get(cid) ?? { sum: 0, count: 0 };
    e.sum += g.score; e.count += 1;
    classGradesPrevious.set(cid, e);
  }
  const classUnpaidCount = new Map<string, number>();
  const classStudentCount = new Map<string, number>();
  for (const s of students) {
    classStudentCount.set(s.classId, (classStudentCount.get(s.classId) ?? 0) + 1);
    if (feeStatusByStudent.get(s.id)) classUnpaidCount.set(s.classId, (classUnpaidCount.get(s.classId) ?? 0) + 1);
  }

  const classPerformance = classes.map((cls) => {
    const cur = classGradesCurrent.get(cls.id);
    const prev = classGradesPrevious.get(cls.id);
    const avg = cur ? Math.round((cur.sum / cur.count) * 10) / 10 : null;
    const prevAvg = prev ? prev.sum / prev.count : null;
    const trend = avg !== null && prevAvg !== null ? Math.round((avg - prevAvg) * 10) / 10 : null;
    const unpaidRatio = (classUnpaidCount.get(cls.id) ?? 0) / Math.max(1, classStudentCount.get(cls.id) ?? 1);
    const status =
      unpaidRatio >= 0.4 ? "fees-outstanding" :
      avg === null        ? "no-data" :
      avg >= 75            ? "high-performer" :
      avg >= passCutoff    ? "stable" :
                              "at-risk";
    return { id: cls.id, name: cls.name, average: avg, trend, status };
  }).filter((c) => c.average !== null);

  // Weekly attendance trend (last 5 weeks) — for the mobile Reports chart.
  const fiveWeeksAgo = new Date();
  fiveWeeksAgo.setDate(fiveWeeksAgo.getDate() - 35);
  const recentAttendance = await prisma.attendance.findMany({
    where: { date: { gte: fiveWeeksAgo } },
    select: { date: true, status: true },
  });
  const today = new Date();
  const weeklyTrend = Array.from({ length: 5 }, (_, i) => {
    const weekEnd = new Date(today);
    weekEnd.setDate(today.getDate() - (4 - i) * 7);
    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekEnd.getDate() - 7);
    const weekRows = recentAttendance.filter((a) => a.date >= weekStart && a.date < weekEnd);
    const pct = weekRows.length > 0
      ? Math.round((weekRows.filter((a) => a.status === "present" || a.status === "late").length / weekRows.length) * 100)
      : 0;
    return { label: `W${i + 1}`, pct };
  });

  // Attendance summary (all-time counts, computed via groupBy — not capped)
  const attendanceGroups = await prisma.attendance.groupBy({ by: ["status"], _count: { _all: true } });
  const attendanceTotal = attendanceGroups.reduce((s, g) => s + g._count._all, 0);
  const attendanceByStatus = Object.fromEntries(attendanceGroups.map((g) => [g.status, g._count._all]));
  const attendanceRate = attendanceTotal > 0
    ? Math.round((((attendanceByStatus.present ?? 0) + (attendanceByStatus.late ?? 0)) / attendanceTotal) * 1000) / 10
    : null;

  // Fee collection
  let totalDue = 0, collected = 0;
  for (const f of fees) {
    totalDue += Number(f.amountDue);
    collected += f.payments.reduce((s, p) => s + Number(p.amount), 0);
  }
  const feeRate = totalDue > 0 ? Math.round((collected / totalDue) * 1000) / 10 : null;
  const outstanding = totalDue - collected;

  // Teacher grading patterns — average score awarded per teacher (via subject.staffId)
  const subjects = await prisma.subject.findMany({ select: { id: true, name: true, staffId: true, staff: { select: { firstName: true, lastName: true } } } });
  const subjectToStaff = new Map(subjects.map((s) => [s.id, s.staff ? `${s.staff.firstName} ${s.staff.lastName}` : null]));
  const allGrades = await prisma.grade.findMany({ select: { subjectId: true, score: true } });
  const teacherTotals = new Map<string, { sum: number; count: number }>();
  for (const g of allGrades) {
    const teacher = subjectToStaff.get(g.subjectId);
    if (!teacher) continue;
    const e = teacherTotals.get(teacher) ?? { sum: 0, count: 0 };
    e.sum += g.score; e.count += 1;
    teacherTotals.set(teacher, e);
  }
  const teacherGradingPatterns = Array.from(teacherTotals.entries())
    .map(([teacher, { sum, count }]) => ({ teacher, average: Math.round((sum / count) * 10) / 10, gradesEntered: count }))
    .sort((a, b) => b.gradesEntered - a.gradesEntered);

  // Subject mastery — average + highest + count below pass, per subject (current term)
  const subjectStats = new Map<string, { sum: number; count: number; max: number; below: number }>();
  for (const g of currentGrades) {
    const key = g.subject.name;
    const e = subjectStats.get(key) ?? { sum: 0, count: 0, max: 0, below: 0 };
    e.sum += g.score; e.count += 1; e.max = Math.max(e.max, g.score);
    if (g.score < passCutoff) e.below += 1;
    subjectStats.set(key, e);
  }
  const subjectMastery = Array.from(subjectStats.entries())
    .map(([subject, { sum, count, max, below }]) => ({
      subject, average: Math.round((sum / count) * 10) / 10, highest: max, belowPass: below, total: count,
    }))
    .sort((a, b) => b.average - a.average);

  const academicContext = `${context.year?.name ?? "No active year"} · ${currentTermName ?? "No active term"}`;
  const attendanceSummary = {
    rate: attendanceRate,
    total: attendanceTotal,
    present: attendanceByStatus.present ?? 0,
    absent: attendanceByStatus.absent ?? 0,
    late: attendanceByStatus.late ?? 0,
    excused: attendanceByStatus.excused ?? 0,
  };
  const feeCollection = {
    totalDue, collected, outstanding, feeRate,
    byClass: classes.map((cls) => {
      const classStudentIds = new Set(students.filter((s) => s.classId === cls.id).map((s) => s.id));
      const classFees = fees.filter((f) => classStudentIds.has(f.studentId));
      const due = classFees.reduce((s, f) => s + Number(f.amountDue), 0);
      const paid = classFees.reduce((s, f) => s + f.payments.reduce((ps, p) => ps + Number(p.amount), 0), 0);
      return { id: cls.id, name: cls.name, due, paid, rate: due > 0 ? Math.round((paid / due) * 1000) / 10 : null };
    }).filter((c) => c.due > 0),
  };
  const overdueInvoiceCount = fees.filter((f) => {
    const paid = f.payments.reduce((s, p) => s + Number(p.amount), 0);
    return f.status !== "paid" && paid < Number(f.amountDue);
  }).length;

  return (
    <>
      <div className="mobileOnly">
        <MobileReportsContent
          academicContext={academicContext}
          classAverage={classAverage}
          activeStudentsCount={students.length}
          attendanceSummary={attendanceSummary}
          feeCollection={feeCollection}
          overdueInvoiceCount={overdueInvoiceCount}
          weeklyAttendanceTrend={weeklyTrend}
        />
      </div>
      <div className="desktopOnly">
        <ReportsContent
          academicContext={academicContext}
          termPerformance={{
            classAverage, trendPts, passRate,
            highest: topGrade ? { score: topGrade.score, subject: topGrade.subject.name } : null,
            atRiskCount: atRiskStudentIds.size,
            subjectAverages,
            classPerformance,
          }}
          subjectMastery={subjectMastery}
          teacherGradingPatterns={teacherGradingPatterns}
          attendanceSummary={attendanceSummary}
          feeCollection={feeCollection}
        />
      </div>
    </>
  );
}
