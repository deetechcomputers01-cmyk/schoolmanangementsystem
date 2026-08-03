import { redirect } from "next/navigation";
import { getCurrentUser } from "@backend/auth/cookies";
import { prisma } from "@backend/prisma";
import {
  PaymentReceiptContent,
  type ReceiptPayment,
} from "./PaymentReceiptContent";
import {
  GuardianFeesContent,
  type GuardianFeeRow,
} from "./GuardianFeesContent";

export const dynamic = "force-dynamic";

export async function PaymentReceiptScreen() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (
    !["super_admin", "principal", "staff", "guardian"].includes(user.role)
  ) {
    redirect("/dashboard");
  }

  // ── Guardian branch ──────────────────────────────────────────────────────────
  if (user.role === "guardian") {
    const guardian = await prisma.guardian.findFirst({
      where: { userId: user.id },
      select: { studentId: true },
    });

    if (!guardian) {
      return (
        <GuardianFeesContent studentName="—" className="—" rows={[]} />
      );
    }

    const feeRecords = await prisma.feeRecord.findMany({
      where: { studentId: { in: [guardian.studentId] } },
      include: {
        student: { include: { class: true } },
        payments: { orderBy: { paidAt: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    });

    if (feeRecords.length === 0) {
      return (
        <GuardianFeesContent studentName="—" className="—" rows={[]} />
      );
    }

    const year    = new Date().getFullYear();
    const student = feeRecords[0].student;
    const studentName = `${student.firstName} ${student.lastName}`;
    const className   = student.class?.name ?? "—";

    const rows: GuardianFeeRow[] = feeRecords.map((fee, i) => {
      const allPayments = fee.payments;
      const amountDue   = Number(fee.amountDue);
      const totalPaid   = allPayments.reduce((s, x) => s + Number(x.amount), 0);
      const balance     = Math.max(0, amountDue - totalPaid);
      const dueDate     = new Date(
        fee.createdAt.getTime() + 30 * 24 * 60 * 60 * 1000,
      ).toISOString();
      const invoiceNo   = `INV-${year}-${String(i + 1).padStart(3, "0")}`;

      return {
        feeRecordId: fee.id,
        invoiceNo,
        term: fee.term,
        description: fee.description,
        dueDate,
        amountDue,
        totalPaid,
        balance,
        feeStatus: fee.status,
        payments: allPayments.map((p, pi) => ({
          id: p.id,
          receiptNo: `RCPT-${year}-${String(pi + 1).padStart(3, "0")}`,
          amount: Number(p.amount),
          method: p.method,
          paidAt: p.paidAt.toISOString(),
        })),
      };
    });

    return (
      <GuardianFeesContent
        studentName={studentName}
        className={className}
        rows={rows}
      />
    );
  }

  // ── Admin / staff branch ─────────────────────────────────────────────────────
  const payments = await prisma.payment.findMany({
    orderBy: { paidAt: "desc" },
    include: {
      feeRecord: {
        include: {
          student: {
            include: {
              class: true,
              guardians: { take: 1, orderBy: { createdAt: "asc" } },
            },
          },
          payments: { orderBy: { paidAt: "asc" } },
        },
      },
    },
  });

  if (payments.length === 0) {
    return <PaymentReceiptContent payments={[]} defaultPaymentId={null} />;
  }

  const year = new Date().getFullYear();

  const rows: ReceiptPayment[] = payments.map((p, i) => {
    const fee      = p.feeRecord;
    const student  = fee.student;
    const guardian = student.guardians[0] ?? null;
    const amountDue    = Number(fee.amountDue);
    const allPayments  = fee.payments;
    const totalPaid    = allPayments.reduce((s, x) => s + Number(x.amount), 0);
    const balance      = Math.max(0, amountDue - totalPaid);
    const invoiceNo    = `INV-${year}-${String(i + 1).padStart(3, "0")}`;
    const receiptNo    = `RCPT-${year}-${String(i + 1).padStart(3, "0")}`;

    return {
      id: p.id,
      receiptNo,
      invoiceNo,
      paymentRef: p.reference,
      paidAt: p.paidAt.toISOString(),
      method: p.method,
      amount: Number(p.amount),
      feeRecordId: fee.id,
      term: fee.term,
      description: fee.description,
      amountDue,
      totalPaid,
      balance,
      feeStatus: fee.status,
      studentId: student.id,
      studentName: `${student.firstName} ${student.lastName}`,
      admNo: student.admissionNo,
      className: student.class?.name ?? "—",
      guardianName: guardian?.name ?? null,
      guardianPhone: guardian?.phone ?? null,
      guardianEmail: guardian?.email ?? null,
      siblingPayments: allPayments.map(sp => ({
        id: sp.id,
        receiptNo: `RCPT-${year}-${String(
          payments.findIndex(x => x.id === sp.id) + 1,
        ).padStart(3, "0")}`,
        amount: Number(sp.amount),
        method: sp.method,
        reference: sp.reference,
        paidAt: sp.paidAt.toISOString(),
      })),
    };
  });

  return (
    <PaymentReceiptContent
      payments={rows}
      defaultPaymentId={rows[0]?.id ?? null}
    />
  );
}
