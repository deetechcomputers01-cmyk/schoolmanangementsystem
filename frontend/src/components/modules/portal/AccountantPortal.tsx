import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { currency } from "@backend/utils";
import { Wallet, Receipt, TrendingUp, AlertCircle, CheckCircle2, Clock, Users } from "lucide-react";

type Props = { data: Awaited<ReturnType<typeof import("@backend/services/portal.service").getAccountantPortalData>> };

const STATUS_STYLES: Record<string, string> = {
  draft:    "bg-slate-100 text-slate-600",
  approved: "bg-sky-50 text-sky-600",
  paid:     "bg-emerald/10 text-emerald"
};

export function AccountantPortal({ data }: Props) {
  const { totalFeesDue, totalCollected, outstanding, pendingCount, recentPayments, totalPayrollPaid, recentPayslips } = data;

  const collectionRate = totalFeesDue > 0 ? Math.round((totalCollected / totalFeesDue) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-navy px-8 py-8 text-white">
        <div className="relative z-10">
          <p className="text-sm text-slate-400">Finance Hub</p>
          <h1 className="mt-1 font-heading text-3xl font-bold">Financial Overview</h1>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Badge roleName="accountant">Collection Rate {collectionRate}%</Badge>
            <span className="text-sm text-slate-400">{pendingCount} pending fee{pendingCount !== 1 ? "s" : ""}</span>
          </div>
        </div>
        <Wallet size={120} className="absolute right-6 top-4 text-white/5" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard icon={<TrendingUp size={20} className="text-navy" />} bg="bg-navy/10"
          label="Total Fees Due" value={currency(totalFeesDue)} sub="all students" />
        <StatCard icon={<CheckCircle2 size={20} className="text-emerald" />} bg="bg-emerald/10"
          label="Collected" value={currency(totalCollected)} sub={`${collectionRate}% collection rate`} />
        <StatCard icon={<AlertCircle size={20} className="text-amber" />} bg="bg-amber/10"
          label="Outstanding" value={currency(outstanding)} sub={`${pendingCount} accounts`} />
        <StatCard icon={<Receipt size={20} className="text-sky-600" />} bg="bg-sky-50"
          label="Payroll Paid" value={currency(totalPayrollPaid)} sub="approved payslips" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Payments */}
        <Card>
          <h2 className="mb-4 font-heading text-base font-semibold text-navy flex items-center gap-2">
            <Receipt size={16} /> Recent Payments
          </h2>
          {recentPayments.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted">No payments recorded yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-xs font-semibold text-muted">
                <tr>
                  <th className="pb-2">Student</th>
                  <th className="pb-2">Method</th>
                  <th className="pb-2 text-right">Amount</th>
                  <th className="pb-2 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {recentPayments.map((p) => (
                  <tr key={p.id}>
                    <td className="py-2">
                      <p className="font-semibold text-navy">
                        {p.feeRecord.student.firstName} {p.feeRecord.student.lastName}
                      </p>
                      <p className="text-xs text-muted">{p.feeRecord.student.admissionNo}</p>
                    </td>
                    <td className="py-2 text-muted capitalize">{p.method.replace("_", " ")}</td>
                    <td className="py-2 text-right font-data font-semibold text-emerald">
                      {currency(Number(p.amount))}
                    </td>
                    <td className="py-2 text-right text-xs text-muted">
                      {new Date(p.paidAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        {/* Recent Payslips */}
        <Card>
          <h2 className="mb-4 font-heading text-base font-semibold text-navy flex items-center gap-2">
            <Users size={16} /> Payroll — Recent Payslips
          </h2>
          {recentPayslips.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted">No payslips generated yet.</p>
          ) : (
            <div className="space-y-2">
              {recentPayslips.map((ps) => (
                <div key={ps.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-navy">
                      {ps.staff.firstName} {ps.staff.lastName}
                    </p>
                    <p className="text-xs text-muted">{ps.staff.staffNo} · {ps.month}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-data text-sm font-bold text-navy">{currency(Number(ps.netPay))}</span>
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

      {/* Quick action links */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {[
          { href: "/fees",    label: "Manage Fees",     icon: <Wallet  size={18} /> },
          { href: "/payroll", label: "Payroll",          icon: <Receipt size={18} /> },
          { href: "/reports", label: "Financial Reports", icon: <TrendingUp size={18} /> },
        ].map((link) => (
          <a key={link.href} href={link.href}
            className="flex flex-col items-center gap-2 rounded-xl border border-line bg-white p-4 text-center text-sm font-semibold text-navy shadow-soft transition hover:border-emerald hover:text-emerald">
            {link.icon}
            {link.label}
          </a>
        ))}
      </div>
    </div>
  );
}

function StatCard({ icon, bg, label, value, sub }: { icon: React.ReactNode; bg: string; label: string; value: string; sub: string }) {
  return (
    <Card className="flex items-center gap-4">
      <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${bg}`}>{icon}</span>
      <div>
        <p className="label-sm text-muted">{label}</p>
        <p className="font-data text-xl font-bold text-navy leading-tight">{value}</p>
        <p className="text-xs text-muted">{sub}</p>
      </div>
    </Card>
  );
}
