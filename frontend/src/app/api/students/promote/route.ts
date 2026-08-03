import { type NextRequest } from "next/server";
import { getCurrentUser } from "@backend/auth/cookies";
import { prisma } from "@backend/prisma";
import { audit } from "@backend/services/audit.service";
import { ok, badRequest, forbidden, unauthorized } from "@/lib/http";

type Action = "promote" | "graduate" | "blocked";

interface PreviewRow {
  studentId: string;
  name: string;
  currentClass: string;
  targetClass: string | null;
  action: Action;
  gradeAvg: number | null;
  attendanceRate: number | null;
  outstandingFees: number;
  reasons: string[];
}

async function buildPreview(studentIds: string[]): Promise<PreviewRow[]> {
  const students = await prisma.student.findMany({
    where: { id: { in: studentIds } },
    include: {
      class: true,
      grades: true,
      attendance: true,
      feeRecords: true,
    },
  });

  const classes = await prisma.class.findMany({ where: { isActive: true } });

  return students.map((s) => {
    const name = `${s.firstName} ${s.lastName}`;
    const reasons: string[] = [];

    const gradeAvg = s.grades.length
      ? Math.round((s.grades.reduce((sum, g) => sum + g.score, 0) / s.grades.length) * 10) / 10
      : null;
    const attendanceRate = s.attendance.length
      ? Math.round((s.attendance.filter((a) => a.status === "present").length / s.attendance.length) * 1000) / 10
      : null;
    const outstandingFees = s.feeRecords.filter((f) => f.status !== "paid").length;

    if (gradeAvg !== null && gradeAvg < 40) reasons.push(`Low grade average (${gradeAvg}%)`);
    if (attendanceRate !== null && attendanceRate < 75) reasons.push(`Low attendance (${attendanceRate}%)`);
    if (outstandingFees > 0) reasons.push(`${outstandingFees} outstanding fee record(s)`);
    if (gradeAvg === null) reasons.push("No grade records yet");
    if (attendanceRate === null) reasons.push("No attendance records yet");

    let action: Action = "promote";
    let targetClass: string | null = null;

    if (s.class.order === null) {
      action = "blocked";
      reasons.unshift(`"${s.class.name}" has no promotion order set — configure it on the Classes page first`);
    } else {
      const next = classes.find((c) => c.order === (s.class.order as number) + 1);
      if (next) {
        targetClass = next.name;
      } else {
        action = "graduate";
      }
    }

    return {
      studentId: s.id,
      name,
      currentClass: s.class.name,
      targetClass,
      action,
      gradeAvg,
      attendanceRate,
      outstandingFees,
      reasons,
    };
  });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (user.role !== "super_admin" && user.role !== "principal") return forbidden();

  const body = await request.json().catch(() => ({}));
  const studentIds: unknown = body.studentIds;
  if (!Array.isArray(studentIds) || studentIds.length === 0 || !studentIds.every((id) => typeof id === "string")) {
    return badRequest({ studentIds: ["At least one student must be selected"] });
  }

  const preview = await buildPreview(studentIds);

  if (!body.apply) {
    return ok({ preview });
  }

  const classByName = new Map((await prisma.class.findMany()).map((c) => [c.name, c]));
  const results: { studentId: string; ok: boolean }[] = [];

  for (const row of preview) {
    if (row.action === "blocked") { results.push({ studentId: row.studentId, ok: false }); continue; }
    try {
      if (row.action === "graduate") {
        await prisma.student.update({ where: { id: row.studentId }, data: { status: "graduated" } });
      } else if (row.targetClass) {
        const target = classByName.get(row.targetClass);
        if (!target) { results.push({ studentId: row.studentId, ok: false }); continue; }
        await prisma.student.update({ where: { id: row.studentId }, data: { classId: target.id } });
      }
      results.push({ studentId: row.studentId, ok: true });
    } catch {
      results.push({ studentId: row.studentId, ok: false });
    }
  }

  await audit(user, "promote", "Student", studentIds.join(","), {
    count: studentIds.length,
    promoted: results.filter((r) => r.ok).length,
  });

  return ok({ results });
}
