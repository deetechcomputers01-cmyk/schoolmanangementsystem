import { redirect } from "next/navigation";
import { getCurrentUser } from "@backend/auth/cookies";
import { listStudents } from "@backend/services/student.service";
import { prisma } from "@backend/prisma";
import { StudentsContent } from "./StudentsContent";
import { MobileStudentsContent } from "@/screens/mobile/MobileStudentsContent/MobileStudentsContent";

export const dynamic = "force-dynamic";

export type StudentRow = {
  id: string;
  admissionNo: string;
  name: string;
  initials: string;
  photoUrl: string | null;
  classId: string;
  className: string;
  guardianName: string;
  feeStatus: "Paid" | "Pending" | "None";
  attendance: string;
};

const VIEW_ROLES = ["super_admin", "principal", "teacher", "staff"];

export async function StudentsScreen() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!VIEW_ROLES.includes(user.role)) redirect("/dashboard");
  const canManageGuardians = ["super_admin", "principal", "teacher"].includes(user.role);
  const [raw, attendanceRows] = await Promise.all([
    listStudents(),
    prisma.attendance.groupBy({ by: ["studentId", "status"], _count: { _all: true } }),
  ]);

  const attendanceMap = new Map<string, { total: number; good: number }>();
  for (const row of attendanceRows) {
    const entry = attendanceMap.get(row.studentId) ?? { total: 0, good: 0 };
    entry.total += row._count._all;
    if (row.status === "present" || row.status === "late") entry.good += row._count._all;
    attendanceMap.set(row.studentId, entry);
  }

  const students: StudentRow[] = raw.map((s) => {
    const latestFee = s.feeRecords[0];
    const feeStatus: StudentRow["feeStatus"] =
      !latestFee ? "None"
      : latestFee.status === "paid" ? "Paid"
      : "Pending";

    const name = `${s.firstName} ${s.lastName}`;
    const initials = `${s.firstName[0] ?? ""}${s.lastName[0] ?? ""}`.toUpperCase();
    const att = attendanceMap.get(s.id);
    const attendance = att && att.total > 0 ? `${Math.round((att.good / att.total) * 100)}%` : "—";

    return {
      id: s.id,
      admissionNo: s.admissionNo,
      name,
      initials,
      photoUrl: s.photoUrl,
      classId: s.classId,
      className: s.class.name,
      guardianName: s.guardians[0]?.name ?? "—",
      feeStatus,
      attendance,
    };
  });

  const total = students.length;
  const withGuardian = raw.filter((s) => s.guardians.length > 0).length;
  const guardiansLinked = total > 0 ? Math.round((withGuardian / total) * 100) : 0;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const newAdmissions = raw.filter((s) => new Date(s.createdAt) >= thirtyDaysAgo).length;

  const genderSummary = raw.reduce(
    (sum, s) => {
      const g = s.gender.toLowerCase();
      if (g === "male" || g === "boy") sum.boys += 1;
      if (g === "female" || g === "girl") sum.girls += 1;
      return sum;
    },
    { boys: 0, girls: 0 },
  );

  const classes = Array.from(new Map(raw.map((s) => [s.classId, s.class.name])).entries())
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <>
      <div className="mobileOnly">
        <MobileStudentsContent
          students={students}
          totalStudents={total}
          genderSummary={genderSummary}
          classes={classes}
          canManageGuardians={canManageGuardians}
        />
      </div>
      <div className="desktopOnly">
        <StudentsContent
          students={students}
          totalStudents={total}
          guardiansLinked={guardiansLinked}
          newAdmissions={newAdmissions}
          canManageGuardians={canManageGuardians}
        />
      </div>
    </>
  );
}
