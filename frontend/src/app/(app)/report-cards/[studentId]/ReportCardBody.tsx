import { gradeFromScore, type GradeBand } from "@backend/utils";

type GradeEntry = { score: number; remarks: string | null } | null;

export interface ReportCardData {
  schoolName: string;
  schoolMotto: string;
  reportFooter: string;
  academicYear: string;
  studentName: string;
  admissionNo: string;
  className: string;
  gender: string;
  dob: string;
  subjects: string[];
  terms: string[];
  lastTerm: string | null;
  gradeMatrix: Record<string, Record<string, GradeEntry>>;
  attendance: { total: number; present: number; absent: number; late: number; pct: number };
  avgLast: number | null;
  rank: { position: number; outOf: number } | null;
  gradingScale: GradeBand[];
  minAttendanceRate: number;
  alertThreshold: number;
}

function gradeLabel(score: number | null, scale: GradeBand[]) {
  if (score === null) return "—";
  return gradeFromScore(score, 100, scale);
}

function gradeColor(score: number | null) {
  if (score === null) return "#41484b";
  if (score >= 70) return "#1b5e1b";
  if (score >= 50) return "#073543";
  return "#ba1a1a";
}

function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
}

export function ReportCardBody(props: ReportCardData) {
  const {
    schoolName, schoolMotto, reportFooter, academicYear,
    studentName, admissionNo, className, gender, dob,
    subjects, terms, lastTerm, gradeMatrix, attendance, avgLast, rank, gradingScale, minAttendanceRate, alertThreshold,
  } = props;

  const infoRows: Array<[string, string]> = [
    ["Student Name", studentName],
    ["Admission No.", admissionNo],
    ["Class", className],
    ["Gender", gender],
    ["Date of Birth", dob],
  ];
  if (academicYear) infoRows.push(["Academic Year", academicYear]);

  return (
    <div className="report-card" style={{ background: "#fff", borderRadius: 4, border: "1px solid #c1c7cb", maxWidth: 860, margin: "0 auto", padding: "32px 36px", fontFamily: "system-ui, sans-serif" }}>
      {/* School header */}
      <div style={{ textAlign: "center", marginBottom: 24, paddingBottom: 20, borderBottom: "2px solid #073543" }}>
        {schoolName && (
          <div style={{ fontSize: "var(--text-2xl)", fontWeight: 800, color: "#073543", letterSpacing: "0.01em" }}>{schoolName}</div>
        )}
        {schoolMotto && (
          <div style={{ fontSize: "var(--text-xs)", color: "#41484b", marginTop: 4, fontStyle: "italic" }}>{schoolMotto}</div>
        )}
        <div style={{ marginTop: 12, display: "inline-block", background: "#073543", color: "#fff", fontSize: "var(--text-xs)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "4px 20px", borderRadius: 4 }}>
          Academic Report Card{academicYear ? ` — ${academicYear}` : ""}
        </div>
      </div>

      {/* Student info */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 32px", marginBottom: 24, padding: "16px 20px", background: "#ffffff", borderRadius: 4, border: "1px solid #f0f0f0" }}>
        {infoRows.map(([label, val]) => (
          <div key={label} style={{ display: "flex", gap: 8, fontSize: "var(--text-xs)" }}>
            <span style={{ color: "#41484b", minWidth: 120 }}>{label}:</span>
            <span style={{ fontWeight: 600, color: "#141d23" }}>{val}</span>
          </div>
        ))}
      </div>

      {/* Grades table */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "#073543", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Academic Performance</div>
        {subjects.length === 0 || terms.length === 0 ? (
          <p style={{ color: "#41484b", fontSize: "var(--text-xs)", padding: "16px 0" }}>No grades recorded yet.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "var(--text-xs)" }}>
            <thead>
              <tr style={{ background: "#073543", color: "#fff" }}>
                <th style={{ padding: "9px 12px", textAlign: "left", fontWeight: 600, borderRadius: "4px 0 0 0" }}>Subject</th>
                {terms.map((t) => (
                  <th key={t} style={{ padding: "9px 12px", textAlign: "center", fontWeight: 600 }}>{t}</th>
                ))}
                <th style={{ padding: "9px 12px", textAlign: "center", fontWeight: 600 }}>Grade</th>
                <th style={{ padding: "9px 12px", textAlign: "left", fontWeight: 600, borderRadius: "0 4px 0 0" }}>Remark</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((subj, i) => {
                const lastEntry = lastTerm ? (gradeMatrix[subj][lastTerm] ?? null) : null;
                const lastScore = lastEntry?.score ?? null;
                return (
                  <tr key={subj} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa", borderBottom: "1px solid #f0f0f0" }}>
                    <td style={{ padding: "9px 12px", fontWeight: 500, color: "#141d23" }}>{subj}</td>
                    {terms.map((t) => {
                      const entry = gradeMatrix[subj][t];
                      return (
                        <td key={t} style={{ padding: "9px 12px", textAlign: "center", color: entry ? gradeColor(entry.score) : "#41484b", fontWeight: entry ? 600 : 400, fontVariantNumeric: "tabular-nums" }}>
                          {entry ? entry.score.toFixed(0) : "—"}
                        </td>
                      );
                    })}
                    <td style={{ padding: "9px 12px", textAlign: "center", fontWeight: 700, color: gradeColor(lastScore) }}>{gradeLabel(lastScore, gradingScale)}</td>
                    <td style={{ padding: "9px 12px", color: gradeColor(lastScore) }}>
                      {lastEntry?.remarks ?? (lastScore !== null ? (lastScore >= 70 ? "Good performance" : "Needs improvement") : "—")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {avgLast !== null && lastTerm && (
              <tfoot>
                <tr style={{ background: "#f7f7f7", borderTop: "2px solid #073543" }}>
                  <td colSpan={terms.length + 1} style={{ padding: "9px 12px", fontWeight: 700, color: "#073543", textAlign: "right" }}>
                    {lastTerm} Average{rank ? ` (Rank ${ordinal(rank.position)} of ${rank.outOf}):` : ":"}
                  </td>
                  <td style={{ padding: "9px 12px", textAlign: "center", fontWeight: 800, color: gradeColor(avgLast), fontSize: "var(--text-base)" }}>{avgLast}%</td>
                  <td style={{ padding: "9px 12px", color: gradeColor(avgLast), fontWeight: 700 }}>{gradeLabel(avgLast, gradingScale)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        )}
      </div>

      {/* Attendance */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "#073543", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Attendance Summary</div>
        {attendance.total === 0 ? (
          <p style={{ color: "#41484b", fontSize: "var(--text-xs)" }}>No attendance records yet.</p>
        ) : (
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {[
              { label: "Days Recorded", value: attendance.total, color: "#073543" },
              { label: "Present",        value: attendance.present, color: "#1b5e1b" },
              { label: "Absent",         value: attendance.absent,  color: "#ba1a1a" },
              { label: "Late",           value: attendance.late,    color: "#a05a00" },
              { label: "Attendance Rate", value: `${attendance.pct}%`, color: attendance.pct >= minAttendanceRate ? "#1b5e1b" : attendance.pct >= alertThreshold ? "#a05a00" : "#ba1a1a" },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ padding: "10px 16px", border: "1px solid #f0f0f0", borderRadius: 4, background: "#ffffff", minWidth: 100, textAlign: "center" }}>
                <div style={{ fontSize: "var(--text-xs)", color: "#41484b", textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</div>
                <div style={{ fontSize: "var(--text-xl)", fontWeight: 700, color, marginTop: 4, fontVariantNumeric: "tabular-nums" }}>{value}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {reportFooter && (
        <div style={{ marginTop: 32, paddingTop: 16, borderTop: "1px solid #c1c7cb", fontSize: "var(--text-xs)", color: "#41484b", textAlign: "center" }}>
          {reportFooter}
        </div>
      )}

      {/* Signature row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24, marginTop: 28, paddingTop: 20, borderTop: "1px solid #f0f0f0" }}>
        {["Class Teacher", "Head Teacher / Principal", "Parent / Guardian"].map((role) => (
          <div key={role} style={{ textAlign: "center" }}>
            <div style={{ borderBottom: "1px solid #073543", marginBottom: 6, height: 36 }} />
            <div style={{ fontSize: "var(--text-xs)", color: "#41484b" }}>{role}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
