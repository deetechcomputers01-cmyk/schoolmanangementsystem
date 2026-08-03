import { redirect } from "next/navigation";
import { getCurrentUser } from "@backend/auth/cookies";
import { prisma } from "@backend/prisma";
import { listPayslips } from "@backend/services/payroll.service";
import { Card } from "@/components/ui/Card";
import { currency } from "@backend/utils";
import { Wallet } from "lucide-react";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  draft:    "bg-slate-100 text-slate-600",
  approved: "bg-sky-50 text-sky-600",
  paid:     "bg-emerald/10 text-emerald",
};

export async function MyPayslipsScreen() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "staff") redirect("/dashboard");

  const staff = await prisma.staff.findFirst({ where: { userId: user.id } });
  if (!staff) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <h2 className="text-xl font-semibold text-on-surface">Staff record not found</h2>
        <p className="mt-2 max-w-sm text-sm text-muted">
          Your account is not linked to a staff record. Contact the school administrator.
        </p>
      </div>
    );
  }

  const payslips = await listPayslips(staff.id);

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="mb-1 font-heading text-2xl font-bold text-navy flex items-center gap-2">
        <Wallet size={22} /> My Payslips
      </h1>
      <p className="mb-6 text-sm text-muted">
        {staff.firstName} {staff.lastName} · {staff.staffNo} · {staff.roleTitle}
      </p>

      <Card>
        {payslips.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted">No payslips have been generated for you yet.</p>
        ) : (
          <div className="space-y-2">
            {payslips.map((ps) => (
              <div key={ps.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-navy">{ps.month}</p>
                  <p className="text-xs text-muted">
                    Basic {currency(ps.basicSalary)} · Allowances {currency(ps.allowances)} · Deductions {currency(ps.deductions)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-data text-sm font-bold text-navy">{currency(ps.netPay)}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${STATUS_STYLES[ps.status] ?? "bg-slate-100 text-slate-600"}`}>
                    {ps.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
