"use client";

import Link from "next/link";
import {
  Users, IdCard, GraduationCap, Wallet, UserPlus, ClipboardCheck,
  Receipt, UserCog, Inbox, CalendarDays,
} from "lucide-react";
import { currency } from "@backend/utils";
import styles from "./MobileDashboardContent.module.css";

export interface MobileDashboardProps {
  greetingName: string;
  todayLabel: string;
  studentsCount: number;
  staffCount: number;
  classesCount: number;
  feesCollected: number;
  attendanceToday: { present: number; absent: number; late: number };
  genderSummary: { boys: number; girls: number };
  systemOverview: { offlineQueue: number; pendingApprovals: number; auditEventsToday: number } | null;
  recentStudents: { id: string; name: string; initials: string; className: string; status: "present" | "absent" | "late" | "excused" | null }[];
  recentPayments: { id: string; amount: number; description: string; studentName: string }[];
  upcomingEvents: { id: string; title: string; date: string }[];
}

const STATUS_LABEL: Record<string, string> = { present: "Present", absent: "Absent", late: "Late", excused: "Excused" };

export function MobileDashboardContent(props: MobileDashboardProps) {
  const {
    greetingName, todayLabel, studentsCount, staffCount, classesCount, feesCollected,
    attendanceToday, genderSummary, systemOverview, recentStudents, recentPayments, upcomingEvents,
  } = props;

  const attTotal = attendanceToday.present + attendanceToday.absent + attendanceToday.late;
  const pct = (n: number) => (attTotal > 0 ? (n / attTotal) * 100 : 0);
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
          <h3 className={styles.cardTitle}>Today&apos;s Attendance</h3>
          <span className={styles.cardHeaderValue}>{attTotal > 0 ? `${Math.round(pct(attendanceToday.present))}%` : "—"}</span>
        </div>
        <div className={styles.segmentBar}>
          <span className={styles.segPresent} style={{ width: `${pct(attendanceToday.present)}%` }} />
          <span className={styles.segAbsent} style={{ width: `${pct(attendanceToday.absent)}%` }} />
          <span className={styles.segLate} style={{ width: `${pct(attendanceToday.late)}%` }} />
        </div>
        <div className={styles.legendRow}>
          <span><i className={styles.dotPresent} />Present ({attendanceToday.present})</span>
          <span><i className={styles.dotAbsent} />Absent ({attendanceToday.absent})</span>
          <span><i className={styles.dotLate} />Late ({attendanceToday.late})</span>
        </div>
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

      <footer className={styles.footer}>© {new Date().getFullYear()} School Administration · ScholarSphere</footer>
    </div>
  );
}
