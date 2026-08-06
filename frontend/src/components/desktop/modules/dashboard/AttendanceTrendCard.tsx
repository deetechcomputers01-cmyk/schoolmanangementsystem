"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { UserCheck, UserX, Clock3, Gauge } from "lucide-react";
import styles from "./AttendanceTrendCard.module.css";

export interface AttendanceTrendPoint { label: string; present: number; absent: number; late: number }

interface Props {
  week: AttendanceTrendPoint[];
  month: AttendanceTrendPoint[];
}

const PRESENT_COLOR = "#5b50f5";
const ABSENT_COLOR = "#e8a8a8";
const LATE_COLOR = "#eab308";

/** Dashboard "Attendance Trend" widget — real Weekly/Monthly toggle over
 *  server-aggregated data (whole-school groupBy, not sliced from a
 *  200-row cap), rendered with recharts (same library/conventions as
 *  ExpensesContent's charts) instead of hand-rolled div bars. */
export function AttendanceTrendCard({ week, month }: Props) {
  const [range, setRange] = useState<"week" | "month">("week");
  const data = range === "week" ? week : month;

  const totals = useMemo(() => {
    const present = data.reduce((sum, p) => sum + p.present, 0);
    const absent = data.reduce((sum, p) => sum + p.absent, 0);
    const late = data.reduce((sum, p) => sum + p.late, 0);
    const total = present + absent + late;
    const rate = total > 0 ? Math.round(((present + late) / total) * 100) : 0;
    return { present, absent, late, rate };
  }, [data]);

  const hasData = data.some((p) => p.present > 0 || p.absent > 0 || p.late > 0);

  return (
    <section className={styles.card}>
      <div className={styles.header}>
        <h2 className={styles.title}>Attendance Trend</h2>
        <div className={styles.toggleTrack}>
          <button type="button" className={range === "week" ? styles.toggleBtnActive : styles.toggleBtn} onClick={() => setRange("week")}>Weekly</button>
          <button type="button" className={range === "month" ? styles.toggleBtnActive : styles.toggleBtn} onClick={() => setRange("month")}>Monthly</button>
        </div>
      </div>

      <div className={styles.statGrid}>
        <div className={styles.statTile}>
          <span className={`${styles.statIconBadge} ${styles.badgeGood}`}><UserCheck size={18} /></span>
          <div>
            <span className={styles.statLabel}>Present</span>
            <strong className={styles.statValueGood}>{totals.present.toLocaleString()}</strong>
          </div>
        </div>
        <div className={styles.statTile}>
          <span className={`${styles.statIconBadge} ${styles.badgeBad}`}><UserX size={18} /></span>
          <div>
            <span className={styles.statLabel}>Absent</span>
            <strong className={styles.statValueBad}>{totals.absent.toLocaleString()}</strong>
          </div>
        </div>
        <div className={styles.statTile}>
          <span className={`${styles.statIconBadge} ${styles.badgeWarn}`}><Clock3 size={18} /></span>
          <div>
            <span className={styles.statLabel}>Late</span>
            <strong className={styles.statValueWarn}>{totals.late.toLocaleString()}</strong>
          </div>
        </div>
        <div className={styles.statTile}>
          <span className={`${styles.statIconBadge} ${styles.badgeAccent}`}><Gauge size={18} /></span>
          <div>
            <span className={styles.statLabel}>Rate</span>
            <strong className={styles.statValueAccent}>{totals.rate}%</strong>
          </div>
        </div>
      </div>

      {hasData ? (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 4 }} barGap={4}>
            <CartesianGrid stroke="var(--clr-app-border)" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#858791" }} axisLine={{ stroke: "#e4e4ec" }} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#858791" }} axisLine={false} tickLine={false} width={32} allowDecimals={false} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6, border: "1px solid #e4e4ec" }} />
            <Legend wrapperStyle={{ fontSize: 12 }} formatter={(value) => <span style={{ color: "var(--clr-app-muted)" }}>{value}</span>} />
            <Bar dataKey="present" name="Present" fill={PRESENT_COLOR} radius={[4, 4, 0, 0]} />
            <Bar dataKey="absent" name="Absent" fill={ABSENT_COLOR} radius={[4, 4, 0, 0]} />
            <Bar dataKey="late" name="Late" fill={LATE_COLOR} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className={styles.empty}>No attendance recorded {range === "week" ? "this week" : "this month"}.</div>
      )}
    </section>
  );
}
