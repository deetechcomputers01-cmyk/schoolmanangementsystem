import { redirect } from "next/navigation";
import { getCurrentUser } from "@backend/auth/cookies";
import { prisma } from "@backend/prisma";
import { AccountantPortalContent } from "./AccountantPortalContent";

export const dynamic = "force-dynamic";

export async function AccountantPortalScreen() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [feeStats, collected, paymentsToday, overdueStudents, cashBreakdown, recentPayments] =
    await Promise.all([
      prisma.feeRecord.aggregate({ _sum: { amountDue: true } }),
      prisma.payment.aggregate({ _sum: { amount: true } }),
      prisma.payment.aggregate({ _sum: { amount: true }, where: { paidAt: { gte: today } } }),
      prisma.student.count({ where: { feeRecords: { some: { status: { in: ["unpaid", "partial"] } } } } }),
      prisma.payment.groupBy({ by: ["method"], _sum: { amount: true }, where: { paidAt: { gte: today } } }),
      prisma.payment.findMany({
        include: {
          feeRecord: {
            include: { student: { select: { firstName: true, lastName: true, class: { select: { name: true } } } } }
          }
        },
        orderBy: { paidAt: "desc" },
        take: 10,
      }),
    ]);

  const feesExpected = Number(feeStats._sum.amountDue ?? 0);
  const totalCollected = Number(collected._sum.amount ?? 0);

  return (
    <AccountantPortalContent
      feesExpected={feesExpected}
      collected={totalCollected}
      outstanding={Math.max(0, feesExpected - totalCollected)}
      paymentsToday={Number(paymentsToday._sum.amount ?? 0)}
      overdueStudents={overdueStudents}
      cashBreakdown={cashBreakdown.map((c) => ({ method: c.method, amount: Number(c._sum.amount ?? 0) }))}
      recentPayments={recentPayments.map((p) => ({
        id: p.id,
        receiptNo: `RCT-${p.id.slice(-8).toUpperCase()}`,
        studentName: `${p.feeRecord.student.firstName} ${p.feeRecord.student.lastName}`,
        studentInitials: `${p.feeRecord.student.firstName[0]}${p.feeRecord.student.lastName[0]}`.toUpperCase(),
        className: p.feeRecord.student.class.name,
        amount: Number(p.amount),
        method: p.method,
        status: "paid",
        date: p.paidAt.toLocaleString("en-GH", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }),
      }))}
    />
  );
}
