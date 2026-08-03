import { redirect } from "next/navigation";
import { getCurrentUser } from "@backend/auth/cookies";
import { getClasses, getSubjects } from "@backend/services/dashboard.service";
import { listGrades } from "@backend/services/grade.service";
import { listStudents } from "@backend/services/student.service";
import { getSettings } from "@backend/services/settings.service";
import type { GradeBand } from "@backend/utils";
import {
  GradebookContent,
  type GradebookProps,
  type GradeRow,
} from "./GradebookContent";
import { MobileGradebookContent } from "@/screens/mobile/MobileGradebookContent/MobileGradebookContent";

export const dynamic = "force-dynamic";

export async function GradebookScreen() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!["super_admin", "principal", "teacher"].includes(user.role)) redirect("/dashboard");

  const [classes, subjects, students, grades, settings] = await Promise.all([
    getClasses(),
    getSubjects(),
    listStudents(),
    listGrades(),
    getSettings(),
  ]);
  const gradingScale = settings.gradingScale as unknown as GradeBand[];

  const studentsByClass: Record<string, GradeRow[]> = {};
  students.forEach(s => {
    if (!studentsByClass[s.classId]) studentsByClass[s.classId] = [];
    const initials = `${s.firstName[0] ?? ""}${s.lastName[0] ?? ""}`.toUpperCase();
    studentsByClass[s.classId].push({
      studentId: s.id,
      studentName: `${s.firstName} ${s.lastName}`,
      admNo: s.admissionNo,
      initials,
    });
  });
  Object.values(studentsByClass).forEach(arr =>
    arr.sort((a, b) => a.studentName.localeCompare(b.studentName))
  );

  const props: GradebookProps = {
    classes: classes.map(c => ({ id: c.id, name: c.name })),
    subjects: subjects.map(s => ({ id: s.id, name: s.name, code: s.code, classId: s.classId })),
    studentsByClass,
    existingGrades: grades.map(g => ({
      studentId: g.studentId,
      subjectId: g.subjectId,
      term: g.term,
      score: g.score,
      remarks: g.remarks ?? undefined,
    })),
    gradingScale,
  };

  return (
    <>
      <div className="mobileOnly">
        <MobileGradebookContent {...props} />
      </div>
      <div className="desktopOnly">
        <GradebookContent {...props} />
      </div>
    </>
  );
}
