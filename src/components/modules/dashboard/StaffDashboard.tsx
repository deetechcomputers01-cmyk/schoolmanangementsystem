import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Banknote, GraduationCap, Receipt } from "lucide-react";
import { currency } from "@/lib/utils";

type Props = {
  data: Awaited<ReturnType<typeof import("@/lib/services/portal.service").getStaffDashboardData>>;
  userName: string;
};

export function StaffDashboard({ data, userName }: Props) {
  const { studentCount, pendingFees, recentPayments } = data;

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-navy px-8 py-8 text-white">
        <div>
          <p className="text-sm text-slate-400">Staff Dashboard</p>
          <h1 className="mt-1 font-heading text-3xl font-bold">Good morning, {userName.split(" ")[0]}</h1>
          <p className="mt-2 text-sm text-slate-400">Here is today&apos;s overview</p>
        </div>
        <Receipt size={110} className="absolute right-6 top-4 text-white/5" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: "Total Students", value: studentCount.toString(),  icon: <GraduationCap size={20} />, bg: "bg-navy/10 text-navy" },
          { label: "Pending Fees",   value: pendingFees.toString(),   icon: <Banknote size={20} />,      bg: "bg-amber/10 text-amber" },
          { label: "Payments Today", value: recentPayments.length.toString(), icon: <Receipt size={20} />, bg: "bg-emerald/10 text-emerald" }
        ].map(({ label, value, icon, bg }) => (
          <Card key={label} className="flex items-center gap-4">
            <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${bg}`}>{icon}</span>
            <div>
              <p className="label-sm text-muted">{label}</p>
              <p className="font-data text-3xl font-bold text-navy">{value}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Recent payments */}
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-base font-semibold text-navy">Recent Payments</h2>
          <Link href="/fees/payments" className="text-xs font-semibold text-emerald hover:underline">View All</Link>
        </div>
        {recentPayments.length === 0 ? (
          <p className="text-sm text-muted">No payments recorded yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-xs font-semibold text-muted">
              <tr>
                <th className="pb-2">Student</th>
                <th className="pb-2">Reference</th>
                <th className="pb-2 text-right">Amount</th>
                <th className="pb-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {recentPayments.map((p) => (
                <tr key={p.id}>
                  <td className="py-2 font-semibold text-navy">
                    {p.feeRecord.student.firstName} {p.feeRecord.student.lastName}
                  </td>
                  <td className="font-data py-2 text-muted">{p.reference}</td>
                  <td className="font-data py-2 text-right font-semibold text-navy">{currency(Number(p.amount))}</td>
                  <td className="py-2">
                    <Badge tone={p.feeRecord.status === "paid" ? "success" : "warning"}>{p.feeRecord.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {[
          { href: "/students",     label: "View Students",   color: "bg-navy text-white" },
          { href: "/fees",         label: "Manage Fees",     color: "bg-emerald text-white" },
          { href: "/report-cards", label: "Report Cards",    color: "bg-amber text-white" }
        ].map(({ href, label, color }) => (
          <Link key={href} href={href}
            className={`rounded-2xl px-4 py-4 text-center text-sm font-semibold transition hover:opacity-90 ${color}`}>
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
