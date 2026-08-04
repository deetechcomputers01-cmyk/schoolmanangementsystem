import { requireRole } from "@backend/auth/page-guard";
import { listScholarships } from "@backend/services/scholarship.service";
import { listStudents } from "@backend/services/student.service";
import { prisma } from "@backend/prisma";
import { ScholarshipsContent } from "./ScholarshipsContent";
import { MobileScholarshipsContent } from "@/screens/mobile/MobileScholarshipsContent/MobileScholarshipsContent";

export const dynamic = "force-dynamic";

export async function ScholarshipsScreen() {
  await requireRole("super_admin", "principal", "staff");

  const [scholarships, students, years] = await Promise.all([
    listScholarships(),
    listStudents(),
    prisma.academicYear.findMany({ orderBy: { startDate: "desc" } }),
  ]);

  const scholarshipRows = scholarships.map((s) => ({
    id: s.id,
    studentId: s.studentId,
    studentName: `${s.student.firstName} ${s.student.lastName}`,
    admissionNo: s.student.admissionNo,
    className: s.student.class.name,
    type: s.type,
    value: s.value,
    reason: s.reason,
    academicYearName: s.academicYear?.name ?? "All years",
    status: s.status,
    approvedByName: s.approvedBy?.name ?? "—",
    createdAt: s.createdAt.toISOString(),
  }));
  const studentRows = students.map((s) => ({
    id: s.id,
    name: `${s.firstName} ${s.lastName}`,
    admissionNo: s.admissionNo,
    className: s.class?.name ?? "—",
  }));
  const yearRows = years.map((y) => ({ id: y.id, name: y.name, isCurrent: y.isCurrent }));

  return (
    <>
      <div className="mobileOnly">
        <MobileScholarshipsContent scholarships={scholarshipRows} students={studentRows} years={yearRows} />
      </div>
      <div className="desktopOnly">
        <ScholarshipsContent scholarships={scholarshipRows} students={studentRows} years={yearRows} />
      </div>
    </>
  );
}
