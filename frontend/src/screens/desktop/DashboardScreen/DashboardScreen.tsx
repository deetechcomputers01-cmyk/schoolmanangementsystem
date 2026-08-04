import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { Download, Bell, Sparkles } from "lucide-react";
import { PaymentActionsMenu } from "@/components/modules/dashboard/PaymentActionsMenu";
import { AnnouncementsWidget } from "@/components/modules/announcements/AnnouncementsWidget";
import { TeacherDashboard } from "@/components/modules/dashboard/TeacherDashboard";
import { StaffDashboard } from "@/components/modules/dashboard/StaffDashboard";
import { ParentDashboard } from "@/components/modules/dashboard/ParentDashboard";
import { StudentPortal } from "@/components/modules/portal/StudentPortal";
import { DesktopPageFrame } from "@/components/desktop/layout/DesktopPageFrame/DesktopPageFrame";
import { MobileDashboardContent } from "@/screens/mobile/MobileDashboardContent/MobileDashboardContent";
import { DashboardStudentsTable, type DashboardStudentRow } from "@/components/modules/dashboard/DashboardStudentsTable";
import { currency } from "@backend/utils";
import { getCurrentUser } from "@backend/auth/cookies";
import { isDatabaseUnavailable, prisma } from "@backend/prisma";
import { listAttendance, getAttendanceTrend } from "@backend/services/attendance.service";
import { AttendanceTrendCard } from "@/components/desktop/modules/dashboard/AttendanceTrendCard";
import { getDashboardStats } from "@backend/services/dashboard.service";
import { listFees } from "@backend/services/fee.service";
import { listStudents } from "@backend/services/student.service";
import {
  getGuardianPortalData,
  getStaffDashboardData,
  getStudentPortalData,
  getSuperAdminExtras,
  getTeacherDashboardData,
} from "@backend/services/portal.service";
import css from "./DashboardScreen.module.css";

export const dynamic = "force-dynamic";

type GenderSummary = {
  boys: number;
  girls: number;
};

const APP = {
  accent: "var(--clr-app-accent)",
  accentSoft: "var(--clr-app-accent-soft)",
  border: "var(--clr-app-border)",
  info: "var(--clr-app-info)",
  muted: "var(--clr-app-muted)",
  text: "var(--clr-app-text)",
} as const;

export async function DashboardScreen() {
  const user = await getCurrentUser();

  try {
    if (user?.role === "teacher") {
      const data = await getTeacherDashboardData(user.id);
      return (
        <>
          <TeacherDashboard data={data} userName={user.name} />
          <AnnouncementsWidget role="teacher" />
        </>
      );
    }

    if (user?.role === "staff") {
      const data = await getStaffDashboardData();
      return (
        <>
          <StaffDashboard data={data} userName={user.name} />
          <AnnouncementsWidget role="staff" />
        </>
      );
    }

    if (user?.role === "student") {
      const data = await getStudentPortalData(user.id).catch(() => null);
      if (!data) {
        return (
          <div className={css.accountUnlinked}>
            <div className={css.accountUnlinkedIcon}>!</div>
            <h2>Account not linked yet</h2>
            <p>Your student account has not been linked to a student record. Please contact the school office.</p>
          </div>
        );
      }
      return <StudentPortal data={data} />;
    }

    if (user?.role === "guardian") {
      const data = await getGuardianPortalData(user.id).catch(() => null);
      return <ParentDashboard data={data} userName={user.name} />;
    }

  const [stats, attendance, attendanceTrend, fees, adminExtras, rawStudents, upcomingEventRows] = await Promise.all([
    getDashboardStats(),
    listAttendance(),
    getAttendanceTrend(),
    listFees(),
    user?.role === "super_admin" ? getSuperAdminExtras() : Promise.resolve(null),
    listStudents(),
    prisma.calendarEvent.findMany({
      where: { date: { gte: new Date() }, approved: true },
      orderBy: { date: "asc" },
      take: 3,
    }),
  ]);

  const present = stats.attendanceToday;
  const attendanceRate = stats.students ? Math.round((present / stats.students) * 100) : 0;
  const collected = fees.reduce(
    (sum, fee) => sum + fee.payments.reduce((inner, payment) => inner + Number(payment.amount), 0),
    0,
  );
  const expected = fees.reduce((sum, fee) => sum + Number(fee.amountDue), 0);
  const pendingFees = Math.max(expected - collected, 0);
  const payments = fees
    .flatMap((fee) => fee.payments.map((payment) => ({
      id: payment.id,
      feeId: fee.id,
      student: fee.student,
      className: fee.student.class.name,
      amount: Number(payment.amount),
      status: fee.status,
    })))
    .slice(0, 5);
  const students = mapStudents(rawStudents);
  const genderSummary = buildGenderSummary(rawStudents);
  const firstName = user?.name?.split(" ")[0] ?? "Administrator";
  const greetingName = user?.role === "super_admin" ? "Administrator" : firstName;

  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const todaysAttendance = attendance.filter((a) => a.date >= todayStart);
  const todayStatusByStudent = new Map(todaysAttendance.map((a) => [a.studentId, a.status]));
  const mobileRecentStudents = [...rawStudents]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 3)
    .map((s) => ({
      id: s.id,
      name: `${s.firstName} ${s.lastName}`,
      initials: `${s.firstName[0] ?? ""}${s.lastName[0] ?? ""}`.toUpperCase(),
      className: s.class.name,
      status: (todayStatusByStudent.get(s.id) ?? null) as "present" | "absent" | "late" | "excused" | null,
    }));
  const mobilePayments = payments.slice(0, 3).map((p) => ({
    id: p.id,
    amount: p.amount,
    description: p.status === "paid" ? "Fee payment" : "Partial payment",
    studentName: `${p.student.firstName} ${p.student.lastName}`,
  }));
  const mobileUpcomingEvents = upcomingEventRows.map((e) => ({
    id: e.id,
    title: e.title,
    date: e.date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
  }));

    return (
      <>
      <div className="mobileOnly">
        <MobileDashboardContent
          greetingName={greetingName}
          todayLabel={new Date().toLocaleDateString("en-GB", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
          studentsCount={stats.students}
          staffCount={stats.staff}
          classesCount={stats.classes}
          feesCollected={collected}
          attendanceTrend={attendanceTrend}
          genderSummary={genderSummary}
          systemOverview={adminExtras ? {
            offlineQueue: 0,
            pendingApprovals: 0,
            auditEventsToday: adminExtras.recentAudit.filter((a) => a.createdAt >= todayStart).length,
          } : null}
          recentStudents={mobileRecentStudents}
          recentPayments={mobilePayments}
          upcomingEvents={mobileUpcomingEvents}
        />
      </div>
      <div className="desktopOnly">
      <DesktopPageFrame
        title={`Hello, ${greetingName}. Welcome back.`}
        subtitle="Here is your school overview for today."
        action={null}
      >
      <div className={css.dashboard}>
        <div className={css.dashboardToolbar}>
          <div className={css.toolbarLead}>
            <span className={css.toolbarHint}>Overview</span>
          </div>
          <div className={css.toolbarActions}>
            <label className={css.selectWrap}>
              <span className={css.srOnly}>Dashboard period</span>
              <select className={css.periodSelect} defaultValue="month">
                <option value="month">This Month</option>
                <option value="term">This Term</option>
                <option value="year">This Year</option>
              </select>
            </label>
            <Link href="/reports" className={css.downloadButton}>
              <Download size={14} aria-hidden />
              Download
            </Link>
          </div>
        </div>

        <div className={css.statsGrid}>
          <StatCard
            icon={<WalletIcon />}
            label="Total Revenue"
            value={currency(collected)}
            sub="Collected to date"
            href="/fees"
          />
          <StatCard
            icon={<SchoolIcon />}
            label="Total Students"
            value={stats.students.toLocaleString()}
            sub="Enrolled students"
            href="/students"
          />
          <StatCard
            icon={<CheckIcon />}
            label="Present Today"
            value={present.toLocaleString()}
            sub={`${attendanceRate}% attendance rate`}
            progress={attendanceRate}
            href="/attendance"
          />
          <StatCard
            icon={<BadgeIcon />}
            label="Staff Count"
            value={stats.staff.toLocaleString()}
            sub="Active staff members"
            href="/staff"
          />
        </div>

        <div className={css.analyticsGrid}>
          <AttendanceTrendCard week={attendanceTrend.week} month={attendanceTrend.month} />

          <SurfaceCard title="Students Boys/Girls">
            <GenderChart data={genderSummary} total={rawStudents.length} />
          </SurfaceCard>
        </div>

        <SurfaceCard title="Recent Students" className={css.tableSurface}>
          <DashboardStudentsTable rows={students} total={students.length} />
        </SurfaceCard>

        <div className={css.commsGrid}>
          <SurfaceCard
            title="Announcements"
            action={
              <Link href="/announcements" className={css.cardLink}>
                View All
              </Link>
            }
          >
            <AnnouncementsWidget role={user?.role ?? "principal"} showHeader={false} />
          </SurfaceCard>

          <SurfaceCard
            title="Communication Status"
            action={<span className={css.toolbarMini}><Bell size={12} aria-hidden /> Live</span>}
          >
            <div className={css.communicationStack}>
              <div className={css.communicationItem}>
                <span className={css.communicationLabel}>Pinned notices</span>
                <strong className={css.communicationValue}>3 active</strong>
                <small className={css.communicationMeta}>Critical updates remain visible across user dashboards.</small>
              </div>
              <div className={css.communicationItem}>
                <span className={css.communicationLabel}>Reach this week</span>
                <strong className={css.communicationValue}>Students, staff, guardians</strong>
                <small className={css.communicationMeta}>Targeted announcements are enabled and publishing normally.</small>
              </div>
            </div>
          </SurfaceCard>
        </div>

        <div className={css.lowerGrid}>
          <SurfaceCard title="Recent Fee Payments" action={<Link href="/fees/receipt" className={css.cardLink}>View All</Link>}>
            <div className={css.paymentTableWrap}>
              <table className={css.paymentTable}>
                <thead>
                  <tr>
                    {['Student', 'Class', 'Amount', 'Status', ''].map((heading) => <th key={heading}>{heading}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.id}>
                      <td className={css.paymentStudent}>{payment.student.firstName} {payment.student.lastName}</td>
                      <td>{payment.className}</td>
                      <td className={css.paymentAmount}>{currency(payment.amount)}</td>
                      <td><StatusPill status={payment.status} /></td>
                      <td className={css.paymentAction}><PaymentActionsMenu studentId={payment.student.id} feeRecordId={payment.feeId} /></td>
                    </tr>
                  ))}
                  {payments.length === 0 && <tr><td colSpan={5} className={css.emptyState}>No payments recorded yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </SurfaceCard>

          <SurfaceCard title="Quick Actions" action={<span className={css.toolbarMini}><Sparkles size={12} aria-hidden /> Ready</span>}>
            <div className={css.quickActionsGrid}>
              <QuickAction href="/students" icon={<UserPlusIcon />} label="Add Student" />
              <QuickAction href="/attendance" icon={<ClipboardCheckIcon />} label="Mark Attendance" />
              <QuickAction href="/fees" icon={<ReceiptIcon />} label="Record Payment" />
              <QuickAction href="/reports" icon={<FileTextIcon />} label="Generate Report" />
            </div>
          </SurfaceCard>
        </div>

        {adminExtras && (
          <SurfaceCard title="System Overview">
            <div className={css.systemGrid}>
              <SystemMetric label="Total Users" value={adminExtras.userCount.toLocaleString()} href="/user-role" linkLabel="Manage" />
              <SystemMetric label="Blocked IPs" value={adminExtras.blockedIPCount.toLocaleString()} href="/admin/blocked-ips" linkLabel="Review" danger />
              {adminExtras.recentAudit[0] && (
                <div className={css.auditMetric}>
                  <span className={css.systemLabel}>Last System Action</span>
                  <strong>{adminExtras.recentAudit[0].action}</strong>
                  <small>by {adminExtras.recentAudit[0].user?.name ?? "System"}</small>
                  <Link href="/audit-logs" className={css.inlineLink}>View audit trail</Link>
                </div>
              )}
            </div>
          </SurfaceCard>
        )}

        <Link href="/offline-sync" className={css.syncCard}>
          <span className={css.syncDot} />
          <span><strong>Offline Sync Status</strong><small>System online · Last activity is current</small></span>
          <span className={css.syncArrow}>›</span>
        </Link>

        <footer className={css.footer}>
          © {new Date().getFullYear()} School Administration · ScholarSphere
        </footer>
      </div>
      </DesktopPageFrame>
      </div>
      </>
    );
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      const { DatabaseUnavailable } = await import("@/components/system/DatabaseUnavailable");
      return <DatabaseUnavailable />;
    }
    throw error;
  }
}

function SurfaceCard({
  title,
  action,
  children,
  className = "",
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`${css.surfaceCard} ${className}`}>
      <div className={css.surfaceHeader}>
        <h2 className={css.surfaceTitle}>{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  href,
  progress,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  sub: string;
  href: string;
  progress?: number;
}) {
  return (
    <Link href={href} className={css.statCard}>
      <div className={css.statTop}>
        <span className={css.statLabel}>{label}</span>
        <span className={css.statIcon}>{icon}</span>
      </div>
      <div>
        <strong className={css.statValue}>{value}</strong>
        {progress !== undefined && <span className={css.statProgress} aria-hidden><span style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }} /></span>}
        <span className={css.statSub}>{sub}</span>
      </div>
    </Link>
  );
}

function QuickAction({ href, icon, label }: { href: string; icon: ReactNode; label: string }) {
  return (
    <Link href={href} className={css.quickAction}>
      <span className={css.quickActionIcon}>{icon}</span>
      <span>{label}</span>
    </Link>
  );
}

function SystemMetric({ label, value, href, linkLabel, danger = false }: { label: string; value: string; href: string; linkLabel: string; danger?: boolean }) {
  return (
    <div className={css.systemMetric}>
      <span className={css.systemLabel}>{label}</span>
      <strong className={danger ? css.systemValueDanger : undefined}>{value}</strong>
      <Link href={href} className={css.inlineLink}>{linkLabel}</Link>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const tone = status === "paid" ? css.statusPaid : status === "partial" ? css.statusPartial : css.statusUnpaid;
  return <span className={`${css.statusPill} ${tone}`}>{status}</span>;
}

function GenderChart({ data, total }: { data: GenderSummary; total: number }) {
  const boysAngle = total ? (data.boys / total) * 360 : 0;
  const boysPercent = total ? Math.round((data.boys / total) * 100) : 0;
  const girlsPercent = total ? Math.round((data.girls / total) * 100) : 0;
  const chartStyle: CSSProperties = {
    background: total
      ? `conic-gradient(${APP.accent} 0deg ${boysAngle}deg, ${APP.info} ${boysAngle}deg 360deg)`
      : APP.border,
  };
  return (
    <div className={css.genderChart}>
      <div className={css.donut} style={chartStyle}>
        <div className={css.donutHole}>
          <strong>{total.toLocaleString()}</strong>
          <span>Total</span>
        </div>
      </div>
      <div className={css.genderLegend}>
        <span><i className={css.legendBoys} />Boys ({boysPercent}%)</span>
        <span><i className={css.legendGirls} />Girls ({girlsPercent}%)</span>
      </div>
    </div>
  );
}

function mapStudents(rawStudents: Awaited<ReturnType<typeof listStudents>>): DashboardStudentRow[] {
  return rawStudents.map((student) => {
    const fee = student.feeRecords[0];
    const feeStatus: DashboardStudentRow["feeStatus"] = !fee ? "None" : fee.status === "paid" ? "Paid" : fee.status === "partial" ? "Partial" : "Unpaid";
    return {
      id: student.id,
      name: `${student.firstName} ${student.lastName}`,
      initials: `${student.firstName[0] ?? ""}${student.lastName[0] ?? ""}`.toUpperCase(),
      photoUrl: student.photoUrl,
      admissionNo: student.admissionNo,
      className: student.class.name,
      guardianName: student.guardians[0]?.name ?? "—",
      feeStatus,
    };
  });
}


function buildGenderSummary(rawStudents: Awaited<ReturnType<typeof listStudents>>): GenderSummary {
  return rawStudents.reduce<GenderSummary>((summary, student) => {
    const gender = student.gender.toLowerCase();
    if (gender === "male" || gender === "boy") summary.boys += 1;
    if (gender === "female" || gender === "girl") summary.girls += 1;
    return summary;
  }, { boys: 0, girls: 0 });
}

const SchoolIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 10 12 5l9 5-9 5-9-5Z" /><path d="M6 12v5c3 2 9 2 12 0v-5" /></svg>;
const CheckIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9" /><path d="m8 12 2.5 2.5L16 9" /></svg>;
const WalletIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 7h16a2 2 0 0 1 2 2v9H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h15v4" /><circle cx="17" cy="13" r="1" /></svg>;
const BadgeIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="9" cy="7" r="4" /><path d="M2 21v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2M16 3a4 4 0 0 1 0 8" /></svg>;
const UserPlusIcon = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="9" cy="7" r="4" /><path d="M2 21v-2a4 4 0 0 1 4-4h6M19 8v6M22 11h-6" /></svg>;
const ClipboardCheckIcon = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4V2h6v2M8 13l2 2 5-5" /></svg>;
const ReceiptIcon = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M5 3h14v18l-3-2-4 2-4-2-3 2V3Z" /><path d="M8 8h8M8 12h8M8 16h4" /></svg>;
const FileTextIcon = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6M8 13h8M8 17h6" /></svg>;
