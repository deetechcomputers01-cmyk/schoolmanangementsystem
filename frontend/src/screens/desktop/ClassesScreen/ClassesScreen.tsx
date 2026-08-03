import { requireRole } from "@backend/auth/page-guard";
import { getClasses, getSubjects } from "@backend/services/dashboard.service";
import { listStaff } from "@backend/services/staff.service";
import { prisma } from "@backend/prisma";
import { ClassesContent } from "./ClassesContent";

export const dynamic = "force-dynamic";

export async function ClassesScreen() {
  await requireRole("super_admin", "principal", "teacher", "staff");

  const [classes, subjects, staff, studentCounts] = await Promise.all([
    getClasses({ includeInactive: true }),
    getSubjects(),
    listStaff(),
    (prisma as any).student.groupBy({ by: ["classId"], _count: { id: true } }) as Promise<{ classId: string; _count: { id: number } }[]>,
  ]);

  const enrolledMap = new Map<string, number>(
    studentCounts.map((r: { classId: string; _count: { id: number } }) => [r.classId, r._count.id])
  );

  const teachingStaff = staff.filter((s) => s.staffCategory === "teaching");

  // Build subject rows with teacher names
  const subjectRows = subjects.map((s, i) => ({
    id: s.id,
    name: s.name,
    code: s.code,
    classId: s.classId,
    className: (s as { class?: { name: string } }).class?.name ?? "—",
    teacherName: s.staff ? `${s.staff.firstName} ${s.staff.lastName}` : null,
    status: s.staff ? ("assigned" as const) : ("unassigned" as const),
  }));

  // Build class rows
  const classRows = classes.map((c) => {
    const classSubjects = subjectRows.filter((s) => s.classId === c.id);
    const unassigned = classSubjects.filter((s) => !s.teacherName);

    const classTeacher = c.classTeacher ? `${c.classTeacher.firstName} ${c.classTeacher.lastName}` : null;

    const cap = c.capacity ?? null;
    const enrolled = enrolledMap.get(c.id) ?? 0;
    const ready = classSubjects.length > 0 && unassigned.length === 0;
    const full = cap !== null && enrolled >= cap;

    return {
      id: c.id,
      name: c.name,
      level: c.level,
      isActive: c.isActive,
      order: c.order,
      teacher: classTeacher,
      teacherId: c.classTeacherId ?? null,
      room: c.room,
      enrolled,
      capacity: cap,
      status: !c.isActive ? ("inactive" as const) : full ? ("full" as const) : unassigned.length > 0 ? ("pending" as const) : ("active" as const),
      ready,
      subjects: classSubjects,
    };
  });

  const finalClasses = classRows.map((c) => ({
    ...c,
    subjects: c.subjects.map((s) => ({ id: s.id, name: s.name, assigned: !!s.teacherName })),
  }));

  const stats = {
    activeClasses: finalClasses.filter((c) => c.isActive).length,
    totalSubjects: subjectRows.length,
    unassigned: subjectRows.filter((s) => s.status === "unassigned").length,
    readyPct: finalClasses.length > 0 ? Math.round((finalClasses.filter((c) => c.ready).length / finalClasses.length) * 100) : 0,
  };

  const staffRows = teachingStaff.map((s) => ({
    id: s.id,
    name: `${s.firstName} ${s.lastName}`,
    role: s.roleTitle,
  }));

  return (
    <ClassesContent
      classes={finalClasses}
      subjects={subjectRows.length > 0 ? subjectRows.map((s) => ({ id: s.id, name: s.name, code: s.code, className: s.className, teacherName: s.teacherName, status: s.status })) : []}
      staff={staffRows}
      stats={stats}
    />
  );
}
