/**
 * DashboardScreen — desktop view for the Dashboard module.
 * Wrapped by (app)/layout.tsx which provides sidebar + topbar.
 * Design: PENDING — Stitch "Institutional Excellence" desktop spec.
 */

import Link from "next/link";
import { Banknote, CheckCircle2, GraduationCap, UsersRound } from "lucide-react";
import { DashboardActionBar } from "@/components/modules/dashboard/DashboardActionBar";
import { FloatingQuickAction } from "@/components/modules/dashboard/FloatingQuickAction";
import { PaymentActionsMenu } from "@/components/modules/dashboard/PaymentActionsMenu";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { currency } from "@backend/utils";
import { listAttendance } from "@backend/services/attendance.service";
import { getDashboardStats } from "@backend/services/dashboard.service";
import { listFees } from "@backend/services/fee.service";
import { getCurrentUser } from "@backend/auth/cookies";
import { TeacherDashboard } from "@/components/modules/dashboard/TeacherDashboard";
import { StaffDashboard } from "@/components/modules/dashboard/StaffDashboard";
import { getTeacherDashboardData, getStaffDashboardData, getSuperAdminExtras } from "@backend/services/portal.service";
import { AnnouncementsWidget } from "@/components/modules/announcements/AnnouncementsWidget";
import styles from "./DashboardScreen.module.css";

export const dynamic = "force-dynamic";

export async function DashboardScreen() {
  const user = await getCurrentUser();

  if (user?.role === "teacher") {
    const data = await getTeacherDashboardData(user.id);
    return (
      <div className={styles.root}>
        <TeacherDashboard data={data} userName={user.name} />
        <AnnouncementsWidget role="teacher" />
      </div>
    );
  }

  if (user?.role === "staff") {
    const data = await getStaffDashboardData();
    return (
      <div className={styles.root}>
        <StaffDashboard data={data} userName={user.name} />
        <AnnouncementsWidget role="staff" />
      </div>
    );
  }

  const [stats, attendance, fees, adminExtras] = await Promise.all([
    getDashboardStats(),
    listAttendance(),
    listFees(),
    user?.role === "super_admin" ? getSuperAdminExtras() : Promise.resolve(null),
  ]);

  const present = attendance.filter((row) => row.status === "present").length;
  const attendanceRate = stats.students ? Math.round((present / stats.students) * 100) : 0;
  const collected = fees.reduce(
    (sum, fee) => sum + fee.payments.reduce((inner, p) => inner + Number(p.amount), 0),
    0,
  );
  const expected = fees.reduce((sum, fee) => sum + Number(fee.amountDue), 0);
  const pendingFees = Math.max(expected - collected, 0);
  const months = buildMonthlySeries(attendance, fees);
  const payments = fees
    .flatMap((fee) =>
      fee.payments.map((p) => ({
        id: p.id,
        student: fee.student,
        className: fee.student.class.name,
        reference: p.reference,
        amount: Number(p.amount),
        status: fee.status,
      })),
    )
    .slice(0, 4);
  const revenueChart = buildRevenueChart(months, expected);

  return (
    <div className={styles.root}>
      <section className="mb-8 flex flex-col justify-between gap-6 md:flex-row md:items-center">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-navy md:text-[32px] md:leading-10">
            Academic Dashboard
          </h1>
          <p className="mt-1 text-base text-muted">
            Good morning, {user?.name ?? "Admin"}. Here is the school overview for today.
          </p>
        </div>
        <DashboardActionBar />
      </section>

      <section className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={<GraduationCap size={22} />} label="Total Students" value={stats.students.toLocaleString()} marker={`${fees.length} invoices`} />
        <StatCard icon={<CheckCircle2 size={22} />} label="Present Today" value={present.toLocaleString()} marker={`${attendanceRate}% Today`} success />
        <StatCard icon={<Banknote size={22} />} label="Pending Fees" value={currency(pendingFees)} marker={`${fees.filter((f) => f.status !== "paid").length} open`} warning />
        <StatCard icon={<UsersRound size={22} />} label="Staff Count" value={stats.staff.toLocaleString()} />
      </section>

      <section className="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-heading text-xl font-semibold text-navy">Monthly Attendance</h2>
          </div>
          <div className="flex h-64 items-end justify-between gap-1 px-2 pt-4">
            {months.map((month) => (
              <div key={month.label} className="flex flex-1 flex-col items-center">
                <div className="relative w-full rounded-t-lg bg-emerald/20" style={{ height: month.height }}>
                  <div className="absolute inset-x-0 bottom-0 rounded-t-lg bg-emerald" style={{ height: month.attendanceFill }} />
                </div>
                <span className="label-sm mt-2 text-muted">{month.label}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-heading text-xl font-semibold text-navy">Revenue Trends (GHS)</h2>
            <div className="flex items-center gap-3">
              <Legend color="bg-navy" label="Budget" />
              <Legend color="bg-emerald" label="Actual" />
            </div>
          </div>
          <div className="relative h-64">
            <svg className="h-full w-full" viewBox="0 0 400 150" role="img" aria-label="Revenue trend chart">
              <defs>
                <linearGradient id="revenueGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#6cf8bb" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#6cf8bb" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={revenueChart.actualArea} fill="url(#revenueGradient)" />
              <polyline points={revenueChart.actualPoints} fill="transparent" stroke="#006c49" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              <polyline points={revenueChart.budgetPoints} fill="transparent" stroke="#131b2e" strokeDasharray="4" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <div className="label-sm mt-2 flex justify-between px-2 text-muted">
              {months.map((m) => <span key={m.label}>{m.label}</span>)}
            </div>
          </div>
        </Card>
      </section>

      <section className="overflow-hidden rounded-xl border border-line bg-white shadow-soft">
        <div className="flex items-center justify-between border-b border-line p-6">
          <h2 className="font-heading text-xl font-semibold text-navy">Recent Fee Payments</h2>
          <Link href="/fees/receipt" className="label-sm text-emerald">View All Records</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="label-sm bg-slate-100 text-muted">
              <tr>
                <th className="p-4">Student Name</th>
                <th className="p-4">Class / Grade</th>
                <th className="p-4">Reference ID</th>
                <th className="p-4 text-right">Amount (GHS)</th>
                <th className="p-4">Status</th>
                <th className="p-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {payments.map((payment) => (
                <tr key={payment.id} className="transition hover:translate-x-1 hover:bg-slate-50">
                  <td className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="grid h-8 w-8 place-items-center rounded-full bg-navy text-[10px] font-bold text-white">
                        {payment.student.firstName[0]}{payment.student.lastName[0]}
                      </div>
                      <p className="font-heading font-semibold text-navy">
                        {payment.student.firstName} {payment.student.lastName}
                      </p>
                    </div>
                  </td>
                  <td className="p-4 text-muted">{payment.className}</td>
                  <td className="font-data p-4 text-muted">{payment.reference}</td>
                  <td className="font-data p-4 text-right font-semibold text-navy">{currency(payment.amount)}</td>
                  <td className="p-4">
                    <Badge tone={payment.status === "paid" ? "success" : "warning"}>{payment.status}</Badge>
                  </td>
                  <td className="p-4">
                    <PaymentActionsMenu studentId={payment.student.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {adminExtras && (
        <section className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-purple-100 bg-purple-50 p-5">
            <p className="label-sm text-purple-600">Total Users</p>
            <p className="font-data mt-1 text-3xl font-bold text-purple-800">{adminExtras.userCount}</p>
            <Link href="/user-role" className="mt-2 block text-xs font-semibold text-purple-600 hover:underline">Manage Users →</Link>
          </div>
          <div className="rounded-2xl border border-rose-100 bg-rose-50 p-5">
            <p className="label-sm text-rose-600">Blocked IPs</p>
            <p className="font-data mt-1 text-3xl font-bold text-rose-700">{adminExtras.blockedIPCount}</p>
            <Link href="/user-role" className="mt-2 block text-xs font-semibold text-rose-600 hover:underline">Manage Security →</Link>
          </div>
          <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5">
            <p className="label-sm text-amber-700">Last System Action</p>
            {adminExtras.recentAudit[0] ? (
              <>
                <p className="mt-1 font-heading text-sm font-semibold text-amber-900">{adminExtras.recentAudit[0].action}</p>
                <p className="text-xs text-amber-700">by {adminExtras.recentAudit[0].user?.name ?? "System"}</p>
              </>
            ) : (
              <p className="text-sm text-amber-700">No actions yet</p>
            )}
            <Link href="/audit-logs" className="mt-2 block text-xs font-semibold text-amber-700 hover:underline">View Audit Trail →</Link>
          </div>
        </section>
      )}

      <AnnouncementsWidget role={user?.role ?? "principal"} />

      <footer className="mt-8 flex flex-wrap items-center justify-between gap-2 text-xs text-muted/70">
        <p>(c) 2026 Ghanaian Academy. All Rights Reserved.</p>
        <span className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald" />Primary Server Online
        </span>
      </footer>

      <FloatingQuickAction />
    </div>
  );
}

function buildMonthlySeries(
  attendance: Awaited<ReturnType<typeof listAttendance>>,
  fees: Awaited<ReturnType<typeof listFees>>,
) {
  const now = new Date();
  return Array.from({ length: 6 }).map((_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    const label = date.toLocaleString("en", { month: "short" });
    const monthAtt = attendance.filter(
      (row) => row.date.getMonth() === date.getMonth() && row.date.getFullYear() === date.getFullYear(),
    );
    const present = monthAtt.filter((row) => row.status === "present").length;
    const rate = monthAtt.length ? Math.round((present / monthAtt.length) * 100) : 0;
    const revenue = fees.reduce(
      (sum, fee) =>
        sum + fee.payments
          .filter((p) => p.paidAt.getMonth() === date.getMonth() && p.paidAt.getFullYear() === date.getFullYear())
          .reduce((inner, p) => inner + Number(p.amount), 0),
      0,
    );
    return { label, revenue, height: `${Math.max(32, rate || 35)}%`, attendanceFill: `${Math.max(16, rate || 20)}%` };
  });
}

function buildRevenueChart(months: ReturnType<typeof buildMonthlySeries>, expected: number) {
  const max = Math.max(...months.map((m) => m.revenue), expected / 6, 1);
  const pts = months.map((m, i) => ({
    x: months.length === 1 ? 0 : Math.round((i / (months.length - 1)) * 400),
    y: Math.max(18, Math.round(130 - (m.revenue / max) * 105)),
  }));
  const budgetY = Math.max(18, Math.round(130 - ((expected / 6) / max) * 105));
  return {
    actualPoints: pts.map((p) => `${p.x},${p.y}`).join(" "),
    budgetPoints: pts.map((p) => `${p.x},${budgetY}`).join(" "),
    actualArea: `M ${pts.map((p) => `${p.x},${p.y}`).join(" L ")} L 400,150 L 0,150 Z`,
  };
}

function StatCard({ icon, label, value, marker, success = false, warning = false }: {
  icon: React.ReactNode; label: string; value: string; marker?: string; success?: boolean; warning?: boolean;
}) {
  return (
    <Card className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className={`grid h-10 w-10 place-items-center rounded-lg ${success ? "bg-emerald/10 text-emerald" : warning ? "bg-amber/10 text-amber" : "bg-navy/5 text-navy"}`}>
          {icon}
        </span>
        {marker && (
          <span className={`text-xs font-bold ${success ? "rounded-full bg-emerald/20 px-2 py-0.5 text-emerald" : "text-emerald"}`}>
            {marker}
          </span>
        )}
      </div>
      <p className="label-sm text-muted">{label}</p>
      <h3 className="font-data text-[32px] font-semibold leading-10 text-navy">{value}</h3>
    </Card>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="label-sm flex items-center gap-1 text-muted">
      <span className={`h-2 w-2 rounded-full ${color}`} />{label}
    </span>
  );
}
