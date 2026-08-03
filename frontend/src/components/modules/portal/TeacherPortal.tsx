import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { gradeFromScore, currency, type GradeBand } from "@backend/utils";
import {
  BookOpen, CalendarDays, CheckCircle2, GraduationCap,
  Users, ClipboardList, TrendingUp, Clock
} from "lucide-react";

type Props = { data: Awaited<ReturnType<typeof import("@backend/services/portal.service").getTeacherDashboardData>> };

const GRADE_COLORS: Record<string, string> = {
  A1: "bg-emerald/10 text-emerald",
  B2: "bg-emerald/10 text-emerald",
  B3: "bg-sky-50 text-sky-600",
  C4: "bg-amber/10 text-amber",
  C5: "bg-amber/10 text-amber",
  C6: "bg-amber/10 text-amber",
  D7: "bg-rose-50 text-rose-500",
  E8: "bg-rose-50 text-rose-500",
  F9: "bg-rose-100 text-rose-700"
};

export function TeacherPortal({ data }: Props) {
  const { staffRecord, subjectCount, studentCount, recentGrades, upcomingExams, todayAttendanceCount, subjects, gradingScale } = data;

  const uniqueClasses = [...new Set(subjects.map((s) => s.class.name))];

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-navy px-8 py-8 text-white">
        <div className="relative z-10">
          <p className="text-sm text-slate-400">Teacher Dashboard</p>
          <h1 className="mt-1 font-heading text-3xl font-bold">
            {staffRecord ? `${staffRecord.firstName} ${staffRecord.lastName}` : "Welcome"}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Badge roleName="teacher">{subjectCount} Subject{subjectCount !== 1 ? "s" : ""}</Badge>
            <span className="text-sm text-slate-400">{uniqueClasses.join(" · ")}</span>
          </div>
        </div>
        <GraduationCap size={120} className="absolute right-6 top-4 text-white/5" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard icon={<Users size={20} className="text-navy" />} bg="bg-navy/10"
          label="My Students" value={String(studentCount)} sub="across all classes" />
        <StatCard icon={<BookOpen size={20} className="text-emerald" />} bg="bg-emerald/10"
          label="Subjects" value={String(subjectCount)} sub="assigned" />
        <StatCard icon={<CheckCircle2 size={20} className="text-sky-600" />} bg="bg-sky-50"
          label="Today's Attendance" value={String(todayAttendanceCount)} sub="entries logged" />
        <StatCard icon={<TrendingUp size={20} className="text-amber" />} bg="bg-amber/10"
          label="Recent Grades" value={String(recentGrades.length)} sub="recorded" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Subjects & Classes */}
        <Card>
          <h2 className="mb-4 font-heading text-base font-semibold text-navy flex items-center gap-2">
            <BookOpen size={16} /> My Subjects
          </h2>
          {subjects.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted">No subjects assigned yet.</p>
          ) : (
            <div className="space-y-2">
              {subjects.map((s) => (
                <div key={s.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-navy">{s.name}</p>
                    <p className="text-xs text-muted">{s.class.name} · {s.class.students.length} students</p>
                  </div>
                  <Link href={`/gradebook?classId=${s.classId}&subjectId=${s.id}`}
                    className="text-xs font-semibold text-emerald hover:underline">
                    Gradebook →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Recent Grades */}
        <Card>
          <h2 className="mb-4 font-heading text-base font-semibold text-navy flex items-center gap-2">
            <ClipboardList size={16} /> Recently Graded
          </h2>
          {recentGrades.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted">No grades recorded yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-xs font-semibold text-muted">
                <tr>
                  <th className="pb-2">Student</th>
                  <th className="pb-2">Subject</th>
                  <th className="pb-2 text-center">Score</th>
                  <th className="pb-2 text-center">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {recentGrades.map((g) => {
                  const grade = gradeFromScore(g.score, 100, gradingScale as GradeBand[]);
                  return (
                    <tr key={g.id}>
                      <td className="py-2 font-semibold text-navy">
                        {g.student.firstName} {g.student.lastName}
                      </td>
                      <td className="py-2 text-muted">{g.subject.name}</td>
                      <td className="py-2 text-center font-data">{g.score}</td>
                      <td className="py-2 text-center">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-bold ${GRADE_COLORS[grade] ?? "bg-slate-100 text-slate-600"}`}>
                          {grade}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </Card>
      </div>

      {/* Upcoming Exams */}
      {upcomingExams.length > 0 && (
        <Card>
          <h2 className="mb-4 font-heading text-base font-semibold text-navy flex items-center gap-2">
            <CalendarDays size={16} /> Upcoming Exams
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {upcomingExams.map((exam) => (
              <div key={exam.id} className="rounded-xl border border-line bg-slate-50 p-4">
                <p className="text-sm font-semibold text-navy">{exam.title}</p>
                <p className="mt-1 text-xs text-muted">{exam.subject.name} · {exam.class.name}</p>
                <p className="mt-2 flex items-center gap-1 text-xs text-amber font-semibold">
                  <Clock size={12} />
                  {new Date(exam.scheduledAt).toLocaleDateString("en-GB", {
                    day: "numeric", month: "short", year: "numeric"
                  })}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { href: "/attendance",   label: "Record Attendance", icon: <CheckCircle2 size={18} /> },
          { href: "/gradebook",    label: "Enter Grades",      icon: <ClipboardList size={18} /> },
          { href: "/exams",        label: "Manage Exams",      icon: <CalendarDays  size={18} /> },
          { href: "/report-cards", label: "Report Cards",      icon: <TrendingUp    size={18} /> },
        ].map((link) => (
          <Link key={link.href} href={link.href}
            className="flex flex-col items-center gap-2 rounded-xl border border-line bg-white p-4 text-center text-sm font-semibold text-navy shadow-soft transition hover:border-emerald hover:text-emerald">
            {link.icon}
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

function StatCard({ icon, bg, label, value, sub }: { icon: React.ReactNode; bg: string; label: string; value: string; sub: string }) {
  return (
    <Card className="flex items-center gap-4">
      <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${bg}`}>{icon}</span>
      <div>
        <p className="label-sm text-muted">{label}</p>
        <p className="font-data text-2xl font-bold text-navy">{value}</p>
        <p className="text-xs text-muted">{sub}</p>
      </div>
    </Card>
  );
}
