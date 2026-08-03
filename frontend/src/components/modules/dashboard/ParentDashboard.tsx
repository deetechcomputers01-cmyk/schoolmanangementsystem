"use client";

import { useState } from "react";
import Link from "next/link";

type Child = {
  id: string;
  firstName: string;
  lastName: string;
  admissionNo: string;
  className: string;
  house?: string | null;
  attendance: number;
  classAverage: number;
  feeBalance: number;
  upcomingExams?: Array<{ scheduledAt: Date | string; subject: { name: string } }>;
};

type GuardianData = {
  children: Child[];
  guardian: { name: string; relation: string; phone: string };
  attendanceThresholds?: { minAttendanceRate: number; alertThreshold: number };
} | null;

const T = {
  bg:           "#e5e7eb",
  surface:      "#ffffff",
  border:       "#D8DDD8",
  primary:      "#073543",
  pContainer:   "#244c5a",
  onBg:         "#141d23",
  onSurfaceVar: "#41484b",
  outline:      "#71787b",
  green:        "#486647",
  greenBg:      "#e6f2e6",
  amber:        "#C68B3C",
  amberBg:      "#fdf3e7",
  red:          "#B64B4B",
  redBg:        "#fbeae9",
} as const;

export function ParentDashboard({ data, userName }: { data: GuardianData; userName: string }) {
  const children = data?.children ?? [];
  const [activeIdx, setActiveIdx] = useState(0);
  const child = children[activeIdx];
  const minAttendanceRate = data?.attendanceThresholds?.minAttendanceRate ?? 75;
  const alertThreshold    = data?.attendanceThresholds?.alertThreshold    ?? 60;

  const fmtDate = (d: Date | string) =>
    new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });

  return (
    <div style={{ background: T.bg, minHeight: "100%", padding: "0 0 48px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 28, flexWrap: "wrap" }}>
        <div>
          <h2 style={{ fontSize: "var(--text-3xl)", fontWeight: 700, letterSpacing: "-0.02em", color: T.onBg, lineHeight: "38px", marginBottom: 4 }}>
            Welcome, {userName}.
          </h2>
          <p style={{ fontSize: "var(--text-sm)", color: T.onSurfaceVar }}>Here is a summary of your child&apos;s progress at school.</p>
        </div>
        {children.length > 1 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {children.map((c, i) => (
              <button
                key={c.id}
                onClick={() => setActiveIdx(i)}
                style={{
                  padding: "6px 14px", borderRadius: 4, fontSize: "var(--text-xs)", fontWeight: 500, cursor: "pointer",
                  background: i === activeIdx ? T.primary : T.surface,
                  color:      i === activeIdx ? "#fff" : T.onSurfaceVar,
                  border:     `1px solid ${i === activeIdx ? T.primary : T.border}`,
                }}
              >
                {c.firstName} ({c.className})
              </button>
            ))}
          </div>
        )}
      </div>

      {!child ? (
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 4, padding: 40, textAlign: "center", color: T.outline }}>
          <p style={{ fontSize: "var(--text-base)", marginBottom: 8 }}>No child linked to your account.</p>
          <p style={{ fontSize: "var(--text-xs)" }}>Please contact the school office to link your child&apos;s record.</p>
        </div>
      ) : (
        <>
          {/* Child identity bar */}
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 4, padding: "16px 24px", marginBottom: 20, display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: T.primary, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "var(--text-lg)", fontWeight: 700, flexShrink: 0 }}>
              {child.firstName[0]}{child.lastName[0]}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: "var(--text-lg)", fontWeight: 700, color: T.onBg, marginBottom: 2 }}>
                {child.firstName} {child.lastName}
              </p>
              <p style={{ fontSize: "var(--text-xs)", color: T.onSurfaceVar }}>
                {child.className} · {child.admissionNo}{child.house ? ` · ${child.house}` : ""}
              </p>
            </div>
            <Link href={`/report-cards`} style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: T.pContainer, textDecoration: "none" }}>
              View Report Card →
            </Link>
          </div>

          {/* Stats row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 20 }}>
            <StatCard
              label="Attendance"
              value={`${child.attendance}%`}
              sub="Last 30 school days"
              color={child.attendance >= minAttendanceRate ? T.green : child.attendance >= alertThreshold ? T.amber : T.red}
              bg={child.attendance >= minAttendanceRate ? T.greenBg : child.attendance >= alertThreshold ? T.amberBg : T.redBg}
              href="/timetable"
            />
            <StatCard
              label="Class Average"
              value={`${child.classAverage}%`}
              sub="Current term grades"
              color={child.classAverage >= 70 ? T.green : child.classAverage >= 50 ? T.amber : T.red}
              bg={child.classAverage >= 70 ? T.greenBg : child.classAverage >= 50 ? T.amberBg : T.redBg}
              href="/report-cards"
            />
            <StatCard
              label="Fee Balance"
              value={`GHS ${child.feeBalance.toLocaleString()}`}
              sub={child.feeBalance > 0 ? "Outstanding balance" : "All paid up"}
              color={child.feeBalance > 0 ? T.red : T.green}
              bg={child.feeBalance > 0 ? T.redBg : T.greenBg}
              href="/parent-portal"
            />
          </div>

          {/* Main 2-col grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16 }}>

            {/* Upcoming Exams */}
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 4, overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <h3 style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: T.onBg }}>Upcoming Exams</h3>
                <Link href="/exams" style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: T.pContainer, textDecoration: "none" }}>View All</Link>
              </div>
              {(child.upcomingExams ?? []).length === 0 ? (
                <div style={{ padding: "32px 20px", textAlign: "center", color: T.outline, fontSize: "var(--text-xs)" }}>No upcoming exams scheduled.</div>
              ) : (
                <div>
                  {(child.upcomingExams ?? []).map((ex, idx) => (
                    <div key={idx} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 20px", borderBottom: `1px solid #f4f4f4` }}>
                      <div style={{ width: 40, height: 40, borderRadius: 4, background: T.amberBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: T.amber }}>{fmtDate(ex.scheduledAt)}</span>
                      </div>
                      <div>
                        <p style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: T.onBg }}>{ex.subject.name}</p>
                        <p style={{ fontSize: "var(--text-xs)", color: T.onSurfaceVar }}>{child.className}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick actions */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 4, padding: 20 }}>
                <h3 style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: T.onBg, marginBottom: 14 }}>Quick Actions</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    { href: "/parent-portal", label: "Pay Fees / View Invoices" },
                    { href: "/report-cards",  label: "Download Report Card" },
                    { href: "/timetable",     label: "View Timetable" },
                    { href: "/messages",      label: "Message Teacher" },
                  ].map(({ href, label }) => (
                    <Link key={href} href={href} style={{
                      display: "block", padding: "9px 12px", border: `1px solid ${T.border}`,
                      borderRadius: 4, fontSize: "var(--text-xs)", fontWeight: 500, color: T.pContainer,
                      textDecoration: "none", background: T.surface,
                    }}>
                      {label} →
                    </Link>
                  ))}
                </div>
              </div>

              {/* Fee status summary */}
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 4, padding: 20 }}>
                <h3 style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: T.onBg, marginBottom: 12 }}>Fee Summary</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--text-xs)" }}>
                    <span style={{ color: T.onSurfaceVar }}>Outstanding</span>
                    <span style={{ fontWeight: 700, color: child.feeBalance > 0 ? T.red : T.green }}>
                      GHS {child.feeBalance.toLocaleString()}
                    </span>
                  </div>
                </div>
                <Link href="/parent-portal" style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginTop: 14, padding: "8px", background: T.primary, color: "#fff",
                  borderRadius: 4, fontSize: "var(--text-xs)", fontWeight: 600, textDecoration: "none",
                }}>
                  {child.feeBalance > 0 ? "Pay Now" : "View History"}
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, sub, color, bg, href }: {
  label: string; value: string; sub: string; color: string; bg: string; href?: string;
}) {
  const inner = (
    <div style={{ background: "#fff", border: `1px solid #D8DDD8`, borderRadius: 4, padding: 20, textDecoration: "none", color: "inherit" }}>
      <p style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "#41484b", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</p>
      <div style={{ display: "inline-flex", alignItems: "center", padding: "4px 10px", borderRadius: 4, background: bg, marginBottom: 8 }}>
        <span style={{ fontSize: "var(--text-2xl)", fontWeight: 700, color, fontVariantNumeric: "tabular-nums" }}>{value}</span>
      </div>
      <p style={{ fontSize: "var(--text-xs)", color: "#71787b" }}>{sub}</p>
    </div>
  );
  if (href) return <Link href={href} style={{ textDecoration: "none" }}>{inner}</Link>;
  return inner;
}
