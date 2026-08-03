import { redirect } from "next/navigation";
import { getCurrentUser } from "@backend/auth/cookies";
import { getClasses, getSubjects } from "@backend/services/dashboard.service";
import { listTimetable } from "@backend/services/timetable.service";
import { prisma } from "@backend/prisma";
import { TimetableManageContent } from "./TimetableManageContent";
import { MobileTimetableContent } from "@/screens/mobile/MobileTimetableContent/MobileTimetableContent";

export const dynamic = "force-dynamic";

// Roles allowed to VIEW the timetable
const VIEW_ROLES = ["super_admin", "principal", "teacher", "student", "guardian"];
// Roles allowed to EDIT the timetable
const EDIT_ROLES = ["super_admin", "principal", "teacher"];

export async function TimetableManageScreen() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // Non-teaching staff (drivers, caterers, nurses, security, accountants) cannot access
  if (!VIEW_ROLES.includes(user.role)) redirect("/dashboard");

  const canEdit = EDIT_ROLES.includes(user.role);

  // For guardians, resolve their children's class IDs to auto-filter
  let guardianClassIds: string[] | undefined;
  if (user.role === "guardian") {
    const guardianRecords = await prisma.guardian.findMany({
      where: { userId: user.id },
      include: { student: { select: { classId: true } } },
    });
    guardianClassIds = guardianRecords.map(g => g.student.classId);
  }

  const [classes, subjects, slots] = await Promise.all([
    getClasses(),
    getSubjects(),
    listTimetable(),
  ]);

  const classOptions = classes.map((c) => ({ id: c.id, name: c.name, level: c.level }));
  const visibleClassOptions = guardianClassIds?.length
    ? classOptions.filter((c) => guardianClassIds.includes(c.id))
    : classOptions;

  const subjectOptions = subjects.map((s) => ({
    id: s.id,
    name: s.name,
    code: s.code,
    classId: s.classId,
    teacherName: s.staff ? `${s.staff.firstName} ${s.staff.lastName}` : null,
  }));

  // listTimetable() now returns flat rows via $queryRaw
  const slotRows = slots.map((sl) => ({
    id: sl.id,
    classId: sl.classId,
    className: sl.className,
    subjectId: sl.subjectId,
    subjectName: sl.subjectName,
    teacherName: sl.staffFirstName
      ? `${sl.staffFirstName} ${sl.staffLastName ?? ""}`.trim()
      : null,
    day: sl.day,
    startsAt: sl.startsAt,
    endsAt: sl.endsAt,
    room: sl.room,
    recurrence: sl.recurrence ?? "weekly",
    effectiveDate: sl.effectiveDate ?? null,
    notes: sl.notes ?? null,
  }));

  return (
    <>
      <div className="mobileOnly">
        <MobileTimetableContent
          classOptions={visibleClassOptions}
          subjectOptions={subjectOptions}
          slots={slotRows}
          canEdit={canEdit}
          defaultClassId={guardianClassIds?.[0]}
        />
      </div>
      <div className="desktopOnly">
        <TimetableManageContent
          classOptions={classOptions}
          subjectOptions={subjectOptions}
          slots={slotRows}
          canEdit={canEdit}
          defaultClassId={guardianClassIds?.[0]}
          allowedClassIds={guardianClassIds}
        />
      </div>
    </>
  );
}
