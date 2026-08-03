import { redirect } from "next/navigation";
import { getCurrentUser } from "@backend/auth/cookies";
import { getClasses, getSubjects } from "@backend/services/dashboard.service";
import { listStudents } from "@backend/services/student.service";
import { listAttendance } from "@backend/services/attendance.service";
import { listStaff } from "@backend/services/staff.service";
import { AttendanceMarkingContent, type AttendanceMarkingProps } from "./AttendanceMarkingContent";
import { MobileAttendanceContent } from "@/screens/mobile/MobileAttendanceContent/MobileAttendanceContent";

export const dynamic = "force-dynamic";

export async function AttendanceScreen() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!["super_admin", "principal", "teacher", "staff"].includes(user.role)) redirect("/dashboard");

  const [classes, allStudents, attendance, subjects, staffList] = await Promise.all([
    getClasses(),
    listStudents(),
    listAttendance(),
    getSubjects(),
    listStaff(),
  ]);

  const lastSeenMap: Record<string, string> = {};
  attendance.forEach(a => {
    if (!lastSeenMap[a.studentId]) lastSeenMap[a.studentId] = a.date.toISOString();
  });

  const props: AttendanceMarkingProps = {
    classes: classes.map(c => ({ id: c.id, name: c.name })),
    students: allStudents.map(s => ({
      id: s.id,
      firstName: s.firstName,
      lastName: s.lastName,
      admissionNo: s.admissionNo,
      classId: s.classId,
      photoUrl: s.photoUrl ?? null,
      lastSeen: lastSeenMap[s.id] ?? null,
    })),
    existingAttendance: attendance.map(a => ({
      studentId: a.studentId,
      classId: a.classId,
      date: a.date.toISOString().split("T")[0],
      status: a.status as "present" | "absent" | "late" | "excused",
      note: a.note ?? "",
    })),
    subjects: subjects.map(s => ({
      id: s.id,
      name: s.name,
      classId: s.classId,
      staffId: s.staffId ?? null,
    })),
    staffList: staffList.map(s => ({ id: s.id, name: `${s.firstName} ${s.lastName}` })),
    canEdit: ["super_admin", "principal", "teacher", "staff"].includes(user.role),
  };

  return (
    <>
      <div className="mobileOnly">
        <MobileAttendanceContent {...props} />
      </div>
      <div className="desktopOnly">
        <AttendanceMarkingContent {...props} />
      </div>
    </>
  );
}
