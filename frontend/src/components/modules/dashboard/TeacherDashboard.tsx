import Link from "next/link";
import css from "@/screens/desktop/DashboardScreen/DashboardScreen.module.css";

type Props = {
  data: Awaited<ReturnType<typeof import("@backend/services/portal.service").getTeacherDashboardData>>;
  userName: string;
};

const T = {
  bg:          "#e5e7eb", card: "#ffffff", border: "#D8DDD8",
  onBg:        "#141d23", onSurfaceVar: "#41484b", outline: "#71787b",
  pContainer:  "#244c5a", sContainer: "#f4f4f4", sContLow: "#f7f7f7",
  greenBg:     "#e6f2e6", green: "#5D7C5C",
  amberBg:     "#fdf3e7", amber: "#C68B3C",
  hover:       "#F0F2F0",
} as const;

export function TeacherDashboard({ data, userName }: Props) {
  const { subjectCount, studentCount, recentGrades, upcomingExams, todayAttendanceCount, subjects } = data;

  return (
    <div style={{ background: T.bg, minHeight: "100%" }}>

      {/* Page header */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: "var(--text-3xl)", fontWeight: 700, letterSpacing: "-0.02em", color: T.onBg, lineHeight: "40px", marginBottom: 4 }}>
          Good morning, {userName.split(" ")[0]}.
        </h2>
        <p style={{ fontSize: "var(--text-base)", color: T.onSurfaceVar }}>
          {subjectCount} subject{subjectCount !== 1 ? "s" : ""} · {studentCount} student{studentCount !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Stat cards */}
      <div className={css.teacherStats}>
        {[
          { label: "My Subjects",    value: subjectCount,         iconBg: T.sContainer, iconColor: T.pContainer, icon: <BookIcon /> },
          { label: "My Students",    value: studentCount,         iconBg: T.greenBg,    iconColor: T.green,      icon: <PeopleIcon /> },
          { label: "Present Today",  value: todayAttendanceCount, iconBg: T.amberBg,    iconColor: T.amber,      icon: <CalIcon /> },
          { label: "Upcoming Exams", value: upcomingExams.length, iconBg: T.sContainer, iconColor: T.pContainer, icon: <ClipIcon /> },
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

      {/* 2-col layout */}
      <div className={css.teacherCols}>

        {/* My Subjects */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 4, padding: 24 }}>
          <h3 style={{ fontSize: "var(--text-xl)", fontWeight: 600, color: T.onBg, marginBottom: 16 }}>My Subjects</h3>
          {subjects.length === 0 ? (
            <p style={{ fontSize: "var(--text-sm)", color: T.outline }}>No subjects assigned.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {subjects.map((sub) => (
                <div key={sub.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 4, padding: "12px 16px" }}>
                  <div>
                    <p style={{ fontSize: "var(--text-base)", fontWeight: 600, color: T.onBg }}>{sub.name}</p>
                    <p style={{ fontSize: "var(--text-xs)", color: T.outline }}>{sub.class.name} · {sub.class.students.length} students</p>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <Link href={`/attendance?classId=${sub.classId}`} style={{ padding: "6px 12px", border: `1px solid ${T.border}`, borderRadius: 4, fontSize: "var(--text-xs)", fontWeight: 600, color: T.onSurfaceVar, textDecoration: "none" }}>
                      Attendance
                    </Link>
                    <Link href="/gradebook" style={{ padding: "6px 12px", border: `1px solid ${T.border}`, borderRadius: 4, fontSize: "var(--text-xs)", fontWeight: 600, color: T.onSurfaceVar, textDecoration: "none" }}>
                      Grades
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming exams */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 4, padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h3 style={{ fontSize: "var(--text-xl)", fontWeight: 600, color: T.onBg }}>Upcoming Exams</h3>
            <Link href="/exams" style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: T.pContainer, textDecoration: "none" }}>View All</Link>
          </div>
          {upcomingExams.length === 0 ? (
            <p style={{ fontSize: "var(--text-sm)", color: T.outline }}>No upcoming exams scheduled.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {upcomingExams.map((exam) => (
                <Link key={exam.id} href={`/exams/${exam.id}`} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 4, padding: "12px 16px", textDecoration: "none" }}>
                  <div>
                    <p style={{ fontSize: "var(--text-base)", fontWeight: 600, color: T.onBg }}>{exam.subject.name}</p>
                    <p style={{ fontSize: "var(--text-xs)", color: T.outline }}>{exam.class.name}</p>
                  </div>
                  <p style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: T.outline, whiteSpace: "nowrap" }}>
                    {new Date(exam.scheduledAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent grades */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 4, overflow: "hidden", marginBottom: 24 }}>
        <div style={{ padding: "20px 24px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3 style={{ fontSize: "var(--text-xl)", fontWeight: 600, color: T.onBg }}>Recently Entered Grades</h3>
          <Link href="/gradebook" style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: T.pContainer, textDecoration: "none" }}>View All</Link>
        </div>
        {recentGrades.length === 0 ? (
          <p style={{ padding: "24px", fontSize: "var(--text-sm)", color: T.outline }}>No grades entered yet.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: T.bg, borderBottom: `1px solid ${T.border}` }}>
                {["Student", "Subject", "Score"].map((h) => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: h === "Score" ? "center" : "left", fontSize: "var(--text-sm)", fontWeight: 600, color: T.onBg }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentGrades.map((g) => (
                <tr key={g.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                  <td style={{ padding: "12px 16px", fontSize: "var(--text-base)", fontWeight: 600, color: T.onBg }}>{g.student.firstName} {g.student.lastName}</td>
                  <td style={{ padding: "12px 16px", fontSize: "var(--text-base)", color: T.onSurfaceVar }}>{g.subject.name}</td>
                  <td style={{ padding: "12px 16px", textAlign: "center", fontSize: "var(--text-sm)", fontWeight: 700, color: T.pContainer }}>{g.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Quick action pills */}
      <div className={css.teacherActions}>
        {[
          { href: "/attendance",   label: "Record Attendance" },
          { href: "/gradebook",    label: "Enter Grades" },
          { href: "/exams",        label: "Schedule Exam" },
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

// Icons
const BookIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>;
const PeopleIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const CalIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
const ClipIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12l2 2 4-4"/></svg>;
