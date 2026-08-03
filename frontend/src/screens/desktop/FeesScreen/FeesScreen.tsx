import { redirect } from "next/navigation";
import { getCurrentUser } from "@backend/auth/cookies";
import { prisma } from "@backend/prisma";
import { getSettings } from "@backend/services/settings.service";
import { FeesPaymentsContent, type FeesInvoiceRow, type FeesPaymentsProps } from "./FeesPaymentsContent";
import { MobileFeesContent } from "@/screens/mobile/MobileFeesContent/MobileFeesContent";

export const dynamic = "force-dynamic";

function timeAgo(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export async function FeesScreen({
  studentId,
  feeRecordId,
  recordPayment,
}: {
  studentId?: string;
  feeRecordId?: string;
  recordPayment?: string;
} = {}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!["super_admin", "principal", "staff"].includes(user.role)) redirect("/dashboard");

  const [fees, enrolledStudents, studentList, settings] = await Promise.all([
    prisma.feeRecord.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        student: {
          include: {
            class: true,
            guardians: { take: 1, orderBy: { createdAt: "asc" } },
          },
        },
        payments: true,
        scholarship: true,
      },
    }),
    prisma.student.count(),
    prisma.student.findMany({
      orderBy: { firstName: "asc" },
      include: { class: true },
    }),
    getSettings(),
  ]);

  // Late-payment penalty and grace period are admin-configured in Settings > Fees
  // (SchoolSettings.extra) rather than hardcoded, so an admin's change here takes
  // effect on every invoice immediately.
  const extra = (settings.extra ?? {}) as Record<string, unknown>;
  const gracePeriodDays = Number(extra.gracePeriod) || 30;
  const latePenaltyPercent = Math.max(0, Number(extra.latePaymentPenalty) || 0);

  const now = new Date();
  let expected = 0;
  let collected = 0;
  let outstanding = 0;
  let overdueCount = 0;
  let overdueGHS = 0;

  const rows: FeesInvoiceRow[] = fees.map((f, i) => {
    const amountDue = Number(f.amountDue);
    const amountPaid = f.payments.reduce((s, p) => s + Number(p.amount), 0);
    const dueDate = new Date(f.createdAt.getTime() + gracePeriodDays * 24 * 60 * 60 * 1000);
    const isOverdue = dueDate < now && f.status !== "paid";
    const penalty = isOverdue ? Math.round(Math.max(0, amountDue - amountPaid) * (latePenaltyPercent / 100) * 100) / 100 : 0;
    const balance = Math.max(0, amountDue - amountPaid) + penalty;

    expected += amountDue;
    collected += amountPaid;
    outstanding += balance;
    if (isOverdue) { overdueCount += 1; overdueGHS += balance; }

    let status: "paid" | "pending" | "overdue";
    if (f.status === "paid") status = "paid";
    else if (isOverdue) status = "overdue";
    else status = "pending";

    const year = f.createdAt.getFullYear();
    const guardian = f.student.guardians[0];
    const discountApplied = f.discountApplied ? Number(f.discountApplied) : 0;

    return {
      id: f.id,
      invoiceNo: `INV-${year}-${String(i + 1).padStart(3, "0")}`,
      studentId: f.student.id,
      studentName: `${f.student.firstName} ${f.student.lastName}`,
      classId: f.student.classId,
      className: f.student.class.name,
      guardianName: guardian?.name ?? "—",
      guardianPhone: guardian?.phone ?? "—",
      description: f.description,
      amountDue,
      amountPaid,
      balance,
      latePenalty: penalty,
      dueDate: dueDate.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      isOverdue,
      status,
      discountApplied,
      paidByScholarship: status === "paid" && amountPaid === 0 && discountApplied > 0,
      scholarship: f.scholarship
        ? { type: f.scholarship.type, value: f.scholarship.value, reason: f.scholarship.reason }
        : null,
    };
  });

  const classMap = new Map<string, string>();
  rows.forEach((r) => classMap.set(r.classId, r.className));
  const classes = Array.from(classMap.entries())
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const recentPayments = fees
    .flatMap((f) => f.payments.map((p) => ({ id: p.id, amount: Number(p.amount), reference: p.reference, paidAt: p.paidAt })))
    .sort((a, b) => b.paidAt.getTime() - a.paidAt.getTime())
    .slice(0, 6)
    .map((p) => ({ id: p.id, amount: p.amount, reference: p.reference, timeAgo: timeAgo(p.paidAt) }));

  const props: FeesPaymentsProps = {
    rows,
    stats: {
      expectedGHS: expected,
      collectedGHS: collected,
      outstandingGHS: outstanding,
      overdueCount,
      overdueGHS,
      enrolledStudents,
    },
    classes,
    students: studentList.map((s) => ({
      id: s.id,
      name: `${s.firstName} ${s.lastName}`,
      className: s.class.name,
    })),
    initialStudentId: studentId,
    initialFeeRecordId: feeRecordId,
    recordPaymentOnLoad: recordPayment === "1",
  };

  return (
    <>
      <div className="mobileOnly">
        <MobileFeesContent
          rows={rows}
          stats={{ expectedGHS: expected, collectedGHS: collected, outstandingGHS: outstanding, overdueCount }}
          classes={classes}
          recentPayments={recentPayments}
        />
      </div>
      <div className="desktopOnly">
        <FeesPaymentsContent {...props} />
      </div>
    </>
  );
}
