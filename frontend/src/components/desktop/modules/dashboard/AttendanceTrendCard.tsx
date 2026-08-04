"use client";

import { useMemo, useState } from "react";
import { Check, X, Clock, TrendingUp } from "lucide-react";
import styles from "./AttendanceTrendCard.module.css";

export interface AttendanceTrendPoint { label: string; present: number; absent: number; late: number }

interface Props {
  week: AttendanceTrendPoint[];
  month: AttendanceTrendPoint[];
}

/** Dashboard "Attendance Trend" widget — real Weekly/Monthly toggle over
 *  server-aggregated data (whole-school groupBy, not sliced from a
 *  200-row cap), plus real stat tiles for whichever range is selected.
 *  Replaces the old static weekly-only bar chart, which had no toggle
 *  and no summary stats at all. */
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

  const max = Math.max(...data.flatMap((p) => [p.present, p.absent, p.late]), 1);
  const hasData = data.some((p) => p.present > 0 || p.absent > 0 || p.late > 0);
  const scaleLabels = Array.from({ length: 5 }, (_, i) => {
    const v = max * (1 - i * 0.25);
    return v === 0 ? "0" : max < 10 ? v.toFixed(1) : Math.round(v).toLocaleString();
  });

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
          <div className={styles.statTop}><span className={styles.statLabel}>Present</span><Check size={13} className={styles.iconGood} /></div>
          <strong className={styles.statValueGood}>{totals.present.toLocaleString()}</strong>
        </div>
        <div className={styles.statTile}>
          <div className={styles.statTop}><span className={styles.statLabel}>Absent</span><X size={13} className={styles.iconBad} /></div>
          <strong className={styles.statValueBad}>{totals.absent.toLocaleString()}</strong>
        </div>
        <div className={styles.statTile}>
          <div className={styles.statTop}><span className={styles.statLabel}>Late</span><Clock size={13} className={styles.iconWarn} /></div>
          <strong className={styles.statValueWarn}>{totals.late.toLocaleString()}</strong>
        </div>
        <div className={styles.statTile}>
          <div className={styles.statTop}><span className={styles.statLabel}>Rate</span><TrendingUp size={13} className={styles.iconAccent} /></div>
          <strong className={styles.statValueAccent}>{totals.rate}%</strong>
        </div>
      </div>

      <div className={styles.chart}>
        <div className={styles.chartScale} aria-hidden>
          {scaleLabels.map((label, i) => <span key={`${label}-${i}`}>{label}</span>)}
        </div>
        <div className={styles.plot}>
          <div className={styles.gridLines} aria-hidden />
          {hasData ? (
            <div className={styles.columns}>
              {data.map((point) => {
                const presentH = Math.max(point.present ? 5 : 0, (point.present / max) * 100);
                const absentH = Math.max(point.absent ? 5 : 0, (point.absent / max) * 100);
                return (
                  <div key={point.label} className={styles.column}>
                    <div className={styles.barPair}>
                      {point.late > 0 && (
                        <span className={styles.lateDot} style={{ bottom: `calc(${Math.max(presentH, absentH)}% + 6px)` }} title={`${point.late} late`} />
                      )}
                      <span className={styles.barPresent} style={{ height: `${presentH}%` }} title={`${point.present} present`} />
                      <span className={styles.barAbsent} style={{ height: `${absentH}%` }} title={`${point.absent} absent`} />
                    </div>
                    <span className={styles.columnLabel}>{point.label}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <span className={styles.empty}>No attendance recorded {range === "week" ? "this week" : "this month"}.</span>
          )}
        </div>
      </div>

      <div className={styles.legend}>
        <span><i className={styles.dotPresent} />Present</span>
        <span><i className={styles.dotAbsent} />Absent</span>
        <span><i className={styles.dotLate} />Late</span>
      </div>
    </section>
  );
}
