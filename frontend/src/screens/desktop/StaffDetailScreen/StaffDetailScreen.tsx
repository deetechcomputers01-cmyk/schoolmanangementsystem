import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@backend/auth/cookies";
import { prisma } from "@backend/prisma";
import { getSettings } from "@backend/services/settings.service";
import {
  StaffDetailContent,
  type StaffDetailProps,
} from "./StaffDetailContent";

export const dynamic = "force-dynamic";

export async function StaffDetailScreen({ id, tab, edit, isModal }: { id: string; tab?: string; edit?: string; isModal?: boolean }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!["super_admin", "principal", "staff", "teacher"].includes(user.role)) redirect("/dashboard");

  const [staff, auditLog, settings] = await Promise.all([
    prisma.staff.findUnique({
      where: { id },
      include: {
        user: { select: { email: true, role: true, isActive: true, createdAt: true, passwordChangedAt: true } },
        subjects: { include: { class: { select: { id: true, name: true } } } },
        salary: true,
      },
    }),
    prisma.auditLog.findMany({
      where: { entity: "Staff", entityId: id },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { user: { select: { name: true } } },
    }),
    getSettings(),
  ]);

  if (!staff) {
    return (
      <div style={{ padding: 32 }}>
        <Link href="/staff" style={{ fontSize: "var(--text-sm)", color: "#244c5a" }}>← Back to Staff</Link>
        <p style={{ marginTop: 24, color: "var(--clr-app-muted)" }}>Staff member not found.</p>
      </div>
    );
  }

  const canSeePayroll =
    user.role === "super_admin" ||
    user.role === "principal" ||
    (staff.userId !== null && staff.userId === user.id);

  // Unique classes from subjects
  const classMap = new Map<string, string>();
  staff.subjects.forEach(s => classMap.set(s.class.id, s.class.name));
  const assignedClasses = Array.from(classMap.entries()).map(([classId, className]) => ({
    classId,
    className,
    subjects: staff.subjects.filter(s => s.class.id === classId).map(s => s.name),
  }));

  const initials = `${staff.firstName[0] ?? ""}${staff.lastName[0] ?? ""}`.toUpperCase();
  const joinedDate = staff.createdAt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const yearsOfService = Math.floor((Date.now() - staff.createdAt.getTime()) / (1000 * 60 * 60 * 24 * 365.25));

  const recentActivity = auditLog.map(entry => ({
    action: entry.action,
    userName: entry.user?.name ?? "System",
    date: entry.createdAt.toISOString(),
  }));

  const settingsExtra = (settings.extra ?? {}) as Record<string, unknown>;
  const passwordResetPolicyDays = String(settingsExtra.passwordResetPolicy ?? "never");
  const passwordChangedAt = staff.user?.passwordChangedAt ?? null;
  const passwordAgeDays = passwordChangedAt
    ? Math.floor((Date.now() - passwordChangedAt.getTime()) / (1000 * 60 * 60 * 24))
    : null;
  const passwordResetDue =
    passwordResetPolicyDays !== "never" && passwordAgeDays !== null
      ? passwordAgeDays >= Number(passwordResetPolicyDays)
      : false;

  const props: StaffDetailProps = {
    id: staff.id,
    staffNo: staff.staffNo,
    firstName: staff.firstName,
    lastName: staff.lastName,
    phone: staff.phone,
    roleTitle: staff.roleTitle,
    email: staff.email ?? "",
    photoUrl: staff.photoUrl ?? null,
    documents: Array.isArray(staff.documents)
      ? (staff.documents as unknown as { name: string; url: string; type: string; size: number }[])
      : [],
    notes: staff.notes ?? "",
    isTeaching: staff.isTeaching,
    staffCategory: staff.staffCategory,
    initials,
    joinedDate,
    isActive: staff.user?.isActive ?? true,
    userRole: staff.user?.role ?? "staff",
    userEmail: staff.user?.email ?? "—",
    subjects: staff.subjects.map(s => ({ id: s.id, name: s.name, code: s.code, className: s.class.name })),
    assignedClasses,
    salary: staff.salary
      ? {
          basicSalary: Number(staff.salary.basicSalary),
          allowances: Number(staff.salary.allowances),
          deductions: Number(staff.salary.deductions),
        }
      : null,
    canSeePayroll,
    defaultTab: tab ?? "overview",
    initialEditOpen: edit === "1",
    isModal: !!isModal,
    yearsOfService,
    recentActivity,
    passwordResetPolicyDays,
    passwordAgeDays,
    passwordResetDue,
  };

  return <StaffDetailContent {...props} />;
}
