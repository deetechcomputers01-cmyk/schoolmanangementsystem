import { getCurrentUser } from "@backend/auth/cookies";
import { handleApiError, ok, unauthorized, forbidden, fail } from "@/lib/http";
import { prisma } from "@backend/prisma";
import { audit } from "@backend/services/audit.service";

export const runtime = "nodejs";

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    if (!["super_admin", "principal"].includes(user.role)) return forbidden();

    const payment = await prisma.payment.findUnique({
      where: { id: params.id },
      include: { feeRecord: { include: { payments: true } } },
    });
    if (!payment) return fail("Payment not found", 404);

    await prisma.payment.delete({ where: { id: params.id } });

    // Recalculate fee record status after deletion
    const remainingPaid = payment.feeRecord.payments
      .filter(p => p.id !== params.id)
      .reduce((sum, p) => sum + Number(p.amount), 0);
    const amountDue = Number(payment.feeRecord.amountDue);
    await prisma.feeRecord.update({
      where: { id: payment.feeRecordId },
      data: {
        status: remainingPaid >= amountDue ? "paid" : remainingPaid > 0 ? "partial" : "unpaid",
      },
    });

    await audit(user, "delete", "Payment", params.id, { amount: Number(payment.amount) });
    return ok({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
