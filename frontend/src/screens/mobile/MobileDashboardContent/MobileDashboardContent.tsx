"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  Users, IdCard, GraduationCap, Wallet, UserPlus, ClipboardCheck,
  Receipt, UserCog, Inbox, CalendarDays, UserCheck, UserX, Clock3, Gauge,
} from "lucide-react";
import { currency } from "@backend/utils";
import styles from "./MobileDashboardContent.module.css";

export interface AttendanceTrendPoint { label: string; present: number; absent: number; late: number }

const PRESENT_COLOR = "#5b50f5";
const ABSENT_COLOR = "#e8a8a8";
const LATE_COLOR = "#eab308";

export interface MobileDashboardProps {
  schoolName: string;
  greetingName: string;
  todayLabel: string;
  studentsCount: number;
  staffCount: number;
  classesCount: number;
  feesCollected: number;
  attendanceTrend: { week: AttendanceTrendPoint[]; month: AttendanceTrendPoint[] };
  genderSummary: { boys: number; girls: number };
  systemOverview: { offlineQueue: number; pendingApprovals: number; auditEventsToday: number } | null;
  recentStudents: { id: string; name: string; initials: string; className: string; status: "present" | "absent" | "late" | "excused" | null }[];
  recentPayments: { id: string; amount: number; description: string; studentName: string }[];
  upcomingEvents: { id: string; title: string; date: string }[];
}

const STATUS_LABEL: Record<string, string> = { present: "Present", absent: "Absent", late: "Late", excused: "Excused" };

export function MobileDashboardContent(props: MobileDashboardProps) {
  const {
    schoolName, greetingName, todayLabel, studentsCount, staffCount, classesCount, feesCollected,
    attendanceTrend, genderSummary, systemOverview, recentStudents, recentPayments, upcomingEvents,
  } = props;

  const [range, setRange] = useState<"week" | "month">("week");
  const trendData = range === "week" ? attendanceTrend.week : attendanceTrend.month;
  const trendTotals = useMemo(() => {
    const present = trendData.reduce((sum, p) => sum + p.present, 0);
    const absent = trendData.reduce((sum, p) => sum + p.absent, 0);
    const late = trendData.reduce((sum, p) => sum + p.late, 0);
    const total = present + absent + late;
    const rate = total > 0 ? Math.round(((present + late) / total) * 100) : 0;
    return { present, absent, late, rate };
  }, [trendData]);
  const trendHasData = trendData.some((p) => p.present > 0 || p.absent > 0 || p.late > 0);

  const genderTotal = genderSummary.boys + genderSummary.girls;
  const boysPct = genderTotal > 0 ? (genderSummary.boys / genderTotal) * 100 : 0;

  return (
    <div className={styles.root}>
      <div className={styles.greetingBlock}>
        <div className={styles.syncRow}>
          <span className={styles.syncDot} />
          <span className={styles.syncText}>Online</span>
        </div>
        <h2 className={styles.greeting}>Good day, {greetingName}</h2>
        <p className={styles.dateLine}>{todayLabel}</p>
      </div>

      <section className={styles.kpiGrid}>
        <Link href="/students" className={styles.kpiCard}>
          <div className={styles.kpiTop}><Users size={18} /></div>
          <span className={styles.kpiLabel}>Students</span>
          <strong className={styles.kpiValue}>{studentsCount}</strong>
        </Link>
        <Link href="/staff" className={styles.kpiCard}>
          <div className={styles.kpiTop}><IdCard size={18} /></div>
          <span className={styles.kpiLabel}>Staff</span>
          <strong className={styles.kpiValue}>{staffCount}</strong>
        </Link>
        <Link href="/classes" className={styles.kpiCard}>
          <div className={styles.kpiTop}><GraduationCap size={18} /></div>
          <span className={styles.kpiLabel}>Classes</span>
          <strong className={styles.kpiValue}>{classesCount}</strong>
        </Link>
        <Link href="/fees" className={styles.kpiCard}>
          <div className={styles.kpiTop}><Wallet size={18} /></div>
          <span className={styles.kpiLabel}>Fees Collected</span>
          <strong className={styles.kpiValueSm}>{currency(feesCollected)}</strong>
        </Link>
      </section>

      <section className={styles.card}>
        <div className={styles.cardHeaderRow}>
          <h3 className={styles.cardTitle}>Attendance Trend</h3>
          <div className={styles.trendToggle}>
            <button type="button" className={range === "week" ? styles.trendToggleBtnActive : styles.trendToggleBtn} onClick={() => setRange("week")}>Weekly</button>
            <button type="button" className={range === "month" ? styles.trendToggleBtnActive : styles.trendToggleBtn} onClick={() => setRange("month")}>Monthly</button>
          </div>
        </div>

        <div className={styles.trendStatGrid}>
          <div className={styles.trendStatTile}>
            <span className={`${styles.trendIconBadge} ${styles.trendBadgeGood}`}><UserCheck size={16} /></span>
            <div>
              <span className={styles.trendStatLabel}>Present</span>
              <strong className={styles.trendStatValueGood}>{trendTotals.present}</strong>
            </div>
          </div>
          <div className={styles.trendStatTile}>
            <span className={`${styles.trendIconBadge} ${styles.trendBadgeBad}`}><UserX size={16} /></span>
            <div>
              <span className={styles.trendStatLabel}>Absent</span>
              <strong className={styles.trendStatValueBad}>{trendTotals.absent}</strong>
            </div>
          </div>
          <div className={styles.trendStatTile}>
            <span className={`${styles.trendIconBadge} ${styles.trendBadgeWarn}`}><Clock3 size={16} /></span>
            <div>
              <span className={styles.trendStatLabel}>Late</span>
              <strong className={styles.trendStatValueWarn}>{trendTotals.late}</strong>
            </div>
          </div>
          <div className={styles.trendStatTile}>
            <span className={`${styles.trendIconBadge} ${styles.trendBadgeAccent}`}><Gauge size={16} /></span>
            <div>
              <span className={styles.trendStatLabel}>Rate</span>
              <strong className={styles.trendStatValueAccent}>{trendTotals.rate}%</strong>
            </div>
          </div>
        </div>

        {trendHasData ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={trendData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barGap={2}>
              <CartesianGrid stroke="var(--clr-app-border)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#858791" }} axisLine={{ stroke: "#e4e4ec" }} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#858791" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 6, border: "1px solid #e4e4ec" }} />
              <Legend wrapperStyle={{ fontSize: 11 }} formatter={(value) => <span style={{ color: "var(--clr-app-muted)" }}>{value}</span>} />
              <Bar dataKey="present" name="Present" fill={PRESENT_COLOR} radius={[3, 3, 0, 0]} />
              <Bar dataKey="absent" name="Absent" fill={ABSENT_COLOR} radius={[3, 3, 0, 0]} />
              <Bar dataKey="late" name="Late" fill={LATE_COLOR} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className={styles.emptyRow}>No attendance recorded {range === "week" ? "this week" : "this month"}.</p>
        )}
      </section>

      <section className={styles.card}>
        <h3 className={styles.cardTitle}>Gender Balance</h3>
        <div className={styles.segmentBar}>
          <span className={styles.segBoys} style={{ width: `${boysPct}%` }} />
          <span className={styles.segGirls} style={{ width: `${100 - boysPct}%` }} />
        </div>
        <div className={styles.legendRowCenter}>
          <span><i className={styles.dotBoys} />Boys ({genderSummary.boys})</span>
          <span><i className={styles.dotGirls} />Girls ({genderSummary.girls})</span>
        </div>
      </section>

      {systemOverview && (
        <section className={styles.card}>
          <h3 className={styles.cardTitle}>System Overview</h3>
          <div className={styles.kvList}>
            <div className={styles.kvRow}><span>Offline Queue</span><strong>{systemOverview.offlineQueue}</strong></div>
            <div className={styles.kvRow}><span>Pending Approvals</span><strong>{systemOverview.pendingApprovals}</strong></div>
            <div className={styles.kvRow}><span>Audit Events Today</span><strong>{systemOverview.auditEventsToday}</strong></div>
          </div>
        </section>
      )}

      <section className={styles.quickSection}>
        <h3 className={styles.sectionTitle}>Quick Actions</h3>
        <div className={styles.quickGrid}>
          <Link href="/students" className={`${styles.quickAction} ${styles.quickActionPrimary}`}>
            <UserPlus size={20} /><span>Add Student</span>
          </Link>
          <Link href="/attendance" className={styles.quickAction}>
            <ClipboardCheck size={20} /><span>Mark Attendance</span>
          </Link>
          <Link href="/fees" className={styles.quickAction}>
            <Receipt size={20} /><span>Record Payment</span>
          </Link>
          <Link href="/staff" className={styles.quickAction}>
            <UserCog size={20} /><span>Add Staff</span>
          </Link>
        </div>
      </section>

      <section className={styles.listSection}>
        <div className={styles.sectionHeaderRow}>
          <h3 className={styles.sectionTitle}>Recent Students</h3>
          <Link href="/students" className={styles.viewAllLink}>View All</Link>
        </div>
        <div className={styles.listCard}>
          {recentStudents.length === 0 ? (
            <p className={styles.emptyRow}>No students yet.</p>
          ) : recentStudents.map((s) => (
            <div key={s.id} className={styles.listRow}>
              <div className={styles.listRowLeft}>
                <span className={styles.rowAvatar}>{s.initials}</span>
                <div>
                  <p className={styles.rowTitle}>{s.name}</p>
                  <p className={styles.rowSub}>{s.className}</p>
                </div>
              </div>
              <span className={`${styles.pill} ${s.status ? styles[`pill_${s.status}`] : styles.pillMuted}`}>
                {s.status ? STATUS_LABEL[s.status] : "Not marked"}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.listSection}>
        <h3 className={styles.sectionTitle}>Recent Fee Payments</h3>
        <div className={styles.listCard}>
          {recentPayments.length === 0 ? (
            <p className={styles.emptyRow}>No payments recorded yet.</p>
          ) : recentPayments.map((p) => (
            <div key={p.id} className={styles.listRow}>
              <div>
                <p className={styles.rowTitle}>{currency(p.amount)}</p>
                <p className={styles.rowSub}>{p.description} • {p.studentName}</p>
              </div>
              <Receipt size={16} className={styles.rowIconMuted} />
            </div>
          ))}
        </div>
      </section>

      <section className={styles.listSection}>
        <h3 className={styles.sectionTitle}>Upcoming Events</h3>
        {upcomingEvents.length === 0 ? (
          <div className={styles.emptyState}>
            <Inbox size={28} />
            <p className={styles.emptyStateTitle}>No upcoming events</p>
            <p className={styles.emptyStateSub}>Check back later</p>
          </div>
        ) : (
          <div className={styles.listCard}>
            {upcomingEvents.map((e) => (
              <div key={e.id} className={styles.listRow}>
                <div className={styles.listRowLeft}>
                  <span className={styles.rowIconBox}><CalendarDays size={16} /></span>
                  <p className={styles.rowTitle}>{e.title}</p>
                </div>
                <span className={styles.rowSub}>{e.date}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <footer className={styles.footer}>© {new Date().getFullYear()} {schoolName}</footer>
    </div>
  );
}
