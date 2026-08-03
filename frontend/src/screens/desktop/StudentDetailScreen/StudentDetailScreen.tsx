import { redirect } from "next/navigation";
import { getCurrentUser } from "@backend/auth/cookies";
import { getStudent } from "@backend/services/student.service";
import { getSettings } from "@backend/services/settings.service";
import { prisma } from "@backend/prisma";
import type { GradeBand } from "@backend/utils";
import { StudentDetailContent, type StudentProps } from "./StudentDetailContent";
import { MobileStudentDetailContent } from "@/screens/mobile/MobileStudentDetailContent/MobileStudentDetailContent";

export const dynamic = "force-dynamic";

export async function StudentDetailScreen({ id, edit, isModal }: { id: string; edit?: string; isModal?: boolean }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [student, settings] = await Promise.all([getStudent(id), getSettings()]);
  const gradingScale = settings.gradingScale as unknown as GradeBand[];
  const settingsExtra = (settings.extra ?? {}) as Record<string, unknown>;
  const minAttendanceRate = Number(settingsExtra.minAttendanceRate ?? 75);
  if (!student) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <p style={{ color: "var(--clr-app-muted)", fontSize: "var(--text-base)" }}>Student not found.</p>
      </div>
    );
  }

  if (user.role === "teacher") {
    const staffRec = await prisma.staff.findFirst({
      where: { userId: user.id },
      select: { subjects: { select: { classId: true } } },
    });
    const classIds = staffRec?.subjects.map(s => s.classId) ?? [];
    if (!classIds.includes(student.classId)) redirect("/students");
  }

  // Attendance KPI
  const attTotal      = student.attendance.length;
  const attPres       = student.attendance.filter(a => a.status === "present").length;
  const attendancePct = attTotal > 0 ? Math.round((attPres / attTotal) * 100) : 0;

  // Average grade
  const avgGrade = student.grades.length > 0
    ? Math.round(student.grades.reduce((s, g) => s + g.score, 0) / student.grades.length)
    : null;

  // Outstanding balance
  const totalDue  = student.feeRecords.reduce((s, f) => s + Number(f.amountDue), 0);
  const totalPaid = student.feeRecords.reduce(
    (s, f) => s + f.payments.reduce((p, pay) => p + Number(pay.amount), 0),
    0,
  );
  const outstanding = Math.max(0, totalDue - totalPaid);

  // Recent invoice
  const unpaidRec = student.feeRecords.find(f => f.status !== "paid") ?? student.feeRecords[0] ?? null;
  const recentInvoice: StudentProps["recentInvoice"] = unpaidRec
    ? {
        id: unpaidRec.id,
        description: unpaidRec.description,
        invoiceRef: `INV-${unpaidRec.id.slice(-8).toUpperCase()}`,
        amount: Number(unpaidRec.amountDue),
        status: unpaidRec.status,
        discountApplied: unpaidRec.discountApplied ? Number(unpaidRec.discountApplied) : 0,
        scholarship: unpaidRec.scholarship
          ? { type: unpaidRec.scholarship.type, value: unpaidRec.scholarship.value, reason: unpaidRec.scholarship.reason }
          : null,
      }
    : null;

  // Recent activity
  const activities: StudentProps["recentActivity"] = [];
  student.attendance.slice(0, 3).forEach(a => {
    activities.push({
      type: "attendance",
      label: `Marked ${a.status} for Morning Assembly.`,
      date: a.date.toISOString(),
    });
  });
  student.grades.slice(0, 2).forEach(g => {
    activities.push({
      type: "grade",
      label: `${g.subject.name} assessment recorded. Score: ${g.score}%.`,
      date: (g as { createdAt?: Date }).createdAt?.toISOString() ?? new Date().toISOString(),
    });
  });
  student.feeRecords.slice(0, 1).forEach(f => {
    activities.push({
      type: "fee",
      label: `Invoice generated for ${f.term}.`,
      date: (f as { createdAt?: Date }).createdAt?.toISOString() ?? new Date().toISOString(),
    });
  });
  activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const props: StudentProps = {
    id: student.id,
    firstName: student.firstName,
    lastName: student.lastName,
    admissionNo: student.admissionNo,
    classId: student.classId,
    className: student.class.name,
    house: (student as { boardingHouse?: string | null }).boardingHouse ?? null,
    photoUrl: student.photoUrl ?? null,
    gender: student.gender,
    dateOfBirth: student.dateOfBirth.toISOString(),
    address: student.address,
    admissionDate: student.createdAt.toISOString(),
    guardians: student.guardians.map(g => ({
      id: g.id,
      name: g.name,
      relation: g.relation,
      phone: g.phone,
      email: g.email ?? null,
      hasLogin: !!g.userId,
    })),
    attendancePct,
    avgGrade,
    outstandingBalance: outstanding,
    recentInvoice,
    recentActivity: activities.slice(0, 5),
    grades: student.grades.map(g => ({
      subject: g.subject.name,
      score: g.score,
      term: g.term,
    })),
    gradingScale,
    minAttendanceRate,
    attendanceRecords: student.attendance.map(a => ({
      status: a.status,
      date: a.date.toISOString(),
      note: a.note ?? null,
    })),
    feeRecords: student.feeRecords.map(f => ({
      id: f.id,
      description: f.description,
      term: f.term,
      amountDue: Number(f.amountDue),
      amountPaid: f.payments.reduce((s, p) => s + Number(p.amount), 0),
      status: f.status,
      discountApplied: f.discountApplied ? Number(f.discountApplied) : 0,
      scholarship: f.scholarship
        ? { type: f.scholarship.type, value: f.scholarship.value, reason: f.scholarship.reason }
        : null,
    })),
    health: student.healthRecord
      ? {
          bloodGroup: student.healthRecord.bloodGroup ?? null,
          allergies: student.healthRecord.allergies ?? null,
          conditions: student.healthRecord.conditions ?? null,
        }
      : null,
    canEdit: ["super_admin", "principal", "teacher"].includes(user.role),
    canManageGuardians: ["super_admin", "principal", "teacher"].includes(user.role),
    initialEditOpen: edit === "1",
    isModal: !!isModal,
  };

  return (
    <>
      <div className="mobileOnly"><MobileStudentDetailContent {...props} /></div>
      <div className="desktopOnly"><StudentDetailContent {...props} /></div>
    </>
  );
}
