import { prisma } from "@backend/prisma";
import { DEFAULT_GRADING_SCALE, type GradeBand } from "@backend/utils";
import type { ReportCardData } from "./[studentId]/ReportCardBody";

export async function getStudentReportCardData(studentId: string): Promise<ReportCardData | null> {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      class: true,
      grades: { include: { subject: true }, orderBy: [{ term: "asc" }, { subject: { name: "asc" } }] },
      attendance: { orderBy: { date: "desc" } },
    },
  });
  if (!student) return null;

  const [settings, activeYear, classmateGrades] = await Promise.all([
    prisma.schoolSettings.findFirst(),
    prisma.academicYear.findFirst({ where: { isCurrent: true } }),
    prisma.grade.findMany({ where: { student: { classId: student.classId } }, select: { studentId: true, term: true, score: true } }),
  ]);

  const termSet = new Set(student.grades.map((g) => g.term));
  const terms = termSet.size > 0 ? Array.from(termSet).sort() : [];
  const subjects = Array.from(new Map(student.grades.map((g) => [g.subject.name, g.subject.name])).keys());

  type GradeMatrix = Record<string, Record<string, { score: number; remarks: string | null } | null>>;
  const gradeMatrix: GradeMatrix = {};
  for (const subj of subjects) {
    gradeMatrix[subj] = {};
    for (const term of terms) {
      const g = student.grades.find((x) => x.subject.name === subj && x.term === term);
      gradeMatrix[subj][term] = g ? { score: g.score, remarks: g.remarks } : null;
    }
  }

  const totalAtt = student.attendance.length;
  const present  = student.attendance.filter((a) => a.status === "present").length;
  const absent   = student.attendance.filter((a) => a.status === "absent").length;
  const late     = student.attendance.filter((a) => a.status === "late").length;
  const attPct   = totalAtt > 0 ? Math.round(((present + late) / totalAtt) * 100) : 0;

  const lastTerm = terms[terms.length - 1] ?? null;
  const lastTermGrades = lastTerm ? student.grades.filter((g) => g.term === lastTerm) : [];
  const avgLast = lastTermGrades.length > 0
    ? Math.round(lastTermGrades.reduce((s, g) => s + g.score, 0) / lastTermGrades.length)
    : null;

  let rank: { position: number; outOf: number } | null = null;
  if (lastTerm) {
    const averageByStudent = new Map<string, { total: number; count: number }>();
    for (const g of classmateGrades) {
      if (g.term !== lastTerm) continue;
      const entry = averageByStudent.get(g.studentId) ?? { total: 0, count: 0 };
      entry.total += g.score;
      entry.count += 1;
      averageByStudent.set(g.studentId, entry);
    }
    const ranked = Array.from(averageByStudent.entries())
      .map(([sId, { total, count }]) => ({ studentId: sId, avg: total / count }))
      .sort((a, b) => b.avg - a.avg);
    const position = ranked.findIndex((r) => r.studentId === student.id);
    if (position >= 0) rank = { position: position + 1, outOf: ranked.length };
  }

  const gradingScale = Array.isArray(settings?.gradingScale) && settings.gradingScale.length > 0
    ? settings.gradingScale as unknown as GradeBand[]
    : DEFAULT_GRADING_SCALE;
  const settingsExtra = (settings?.extra ?? {}) as Record<string, unknown>;
  const minAttendanceRate = Number(settingsExtra.minAttendanceRate ?? 75);
  const alertThreshold    = Number(settingsExtra.alertThreshold    ?? 60);

  return {
    schoolName: settings?.name ?? "",
    schoolMotto: settings?.motto ?? "",
    reportFooter: settings?.reportFooter ?? "",
    gradingScale,
    minAttendanceRate,
    alertThreshold,
    academicYear: activeYear?.name ?? "",
    studentName: `${student.firstName} ${student.lastName}`,
    admissionNo: student.admissionNo,
    className: student.class.name,
    gender: student.gender,
    dob: student.dateOfBirth.toLocaleDateString("en-GB"),
    subjects,
    terms,
    lastTerm,
    gradeMatrix,
    attendance: { total: totalAtt, present, absent, late, pct: attPct },
    avgLast,
    rank,
  };
}
