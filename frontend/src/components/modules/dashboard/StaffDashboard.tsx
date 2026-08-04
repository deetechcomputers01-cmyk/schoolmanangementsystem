import Link from "next/link";
import { currency } from "@backend/utils";
import css from "@/screens/desktop/DashboardScreen/DashboardScreen.module.css";

type Props = {
  data: Awaited<ReturnType<typeof import("@backend/services/portal.service").getStaffDashboardData>>;
  userName: string;
};

const T = {
  bg:          "#e5e7eb", card: "#ffffff", border: "#D8DDD8",
  onBg:        "#141d23", onSurfaceVar: "#41484b", outline: "#71787b",
  pContainer:  "#244c5a", sContainer: "#f4f4f4",
  greenBg:     "#e6f2e6", green: "#5D7C5C",
  amberBg:     "#fdf3e7", amber: "#C68B3C",
} as const;

export function StaffDashboard({ data, userName }: Props) {
  const { studentCount, pendingFees, recentPayments } = data;

  return (
    <div style={{ background: T.bg, minHeight: "100%" }}>

      {/* Page header */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: "var(--text-3xl)", fontWeight: 700, letterSpacing: "-0.02em", color: T.onBg, lineHeight: "40px", marginBottom: 4 }}>
          Good morning, {userName.split(" ")[0]}.
        </h2>
        <p style={{ fontSize: "var(--text-base)", color: T.onSurfaceVar }}>Here is today&apos;s overview.</p>
      </div>

      {/* Stat cards */}
      <div className={css.staffStats}>
        {[
          { label: "Total Students",  value: studentCount.toLocaleString(), iconBg: T.sContainer, iconColor: T.pContainer, icon: <GraduationIcon /> },
          { label: "Pending Fees",    value: pendingFees.toLocaleString(),  iconBg: T.amberBg,    iconColor: T.amber,      icon: <BanknoteIcon /> },
          { label: "Payments Today",  value: recentPayments.length.toString(), iconBg: T.greenBg, iconColor: T.green,      icon: <ReceiptIcon /> },
        ].map(({ label, value, iconBg, iconColor, icon }) => (
          <div key={label} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 4, padding: 24, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, letterSpacing: "0.01em", color: T.onSurfaceVar }}>{label}</span>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: iconBg, color: iconColor, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {icon}
              </div>
            </div>
            <div style={{ fontSize: "var(--text-3xl)", fontWeight: 700, letterSpacing: "-0.02em", color: T.onBg, lineHeight: "40px" }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Recent payments */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 4, overflow: "hidden", marginBottom: 24 }}>
        <div style={{ padding: "20px 24px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3 style={{ fontSize: "var(--text-xl)", fontWeight: 600, color: T.onBg }}>Recent Payments</h3>
          <Link href="/fees" style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: T.pContainer, textDecoration: "none" }}>View All</Link>
        </div>
        {recentPayments.length === 0 ? (
          <p style={{ padding: "24px", fontSize: "var(--text-sm)", color: T.outline }}>No payments recorded yet.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: T.bg, borderBottom: `1px solid ${T.border}` }}>
                {["Student", "Reference", "Amount", "Status"].map((h) => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: h === "Amount" ? "right" : "left", fontSize: "var(--text-sm)", fontWeight: 600, color: T.onBg }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentPayments.map((p) => (
                <tr key={p.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                  <td style={{ padding: "12px 16px", fontSize: "var(--text-base)", fontWeight: 600, color: T.onBg }}>
                    {p.feeRecord.student.firstName} {p.feeRecord.student.lastName}
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: "var(--text-sm)", color: T.onSurfaceVar, fontVariantNumeric: "tabular-nums" }}>{p.reference}</td>
                  <td style={{ padding: "12px 16px", fontSize: "var(--text-sm)", fontWeight: 600, color: T.onBg, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                    {currency(Number(p.amount))}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <StatusPill status={p.feeRecord.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Quick links */}
      <div className={css.staffActions}>
        {[
          { href: "/students",     label: "View Students" },
          { href: "/fees",         label: "Manage Fees" },
          { href: "/report-cards", label: "Report Cards" },
        ].map(({ href, label }) => (
          <Link key={href} href={href} style={{
            display: "block", padding: "14px 16px", textAlign: "center",
            background: T.pContainer, color: "#ffffff", borderRadius: 4,
            fontSize: "var(--text-sm)", fontWeight: 600, textDecoration: "none",
          }}>
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    paid:    { bg: "#e6f2e6", color: "#5D7C5C" },
    partial: { bg: "#fdf3e7", color: "#C68B3C" },
    unpaid:  { bg: "#fdf3e7", color: "#C68B3C" },
    overdue: { bg: "#fbeae9", color: "#B64B4B" },
  };
  const s = map[status] ?? { bg: "#f4f4f4", color: "#41484b" };
  return (
    <span style={{ display: "inline-flex", padding: "2px 8px", borderRadius: 4, fontSize: "var(--text-xs)", fontWeight: 500, background: s.bg, color: s.color, textTransform: "capitalize" }}>
      {status}
    </span>
  );
}

const GraduationIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>;
const BanknoteIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg>;
const ReceiptIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1z"/><path d="M8 7h8M8 11h8M8 15h4"/></svg>;
