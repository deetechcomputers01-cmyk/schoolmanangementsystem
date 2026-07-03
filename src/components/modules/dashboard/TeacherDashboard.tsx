import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { BookOpen, CalendarDays, ClipboardList, GraduationCap, Users } from "lucide-react";

type Props = {
  data: Awaited<ReturnType<typeof import("@/lib/services/portal.service").getTeacherDashboardData>>;
  userName: string;
};

export function TeacherDashboard({ data, userName }: Props) {
  const { subjectCount, studentCount, recentGrades, upcomingExams, todayAttendanceCount, subjects } = data;

  const myClasses = [...new Map(subjects.map((s) => [s.classId, s.class])).values()];

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-navy px-8 py-8 text-white">
        <div>
          <p className="text-sm text-slate-400">Teacher Dashboard</p>
          <h1 className="mt-1 font-heading text-3xl font-bold">Good morning, {userName.split(" ")[0]}</h1>
          <p className="mt-2 text-sm text-slate-400">
            {subjectCount} subject{subjectCount !== 1 ? "s" : ""} · {studentCount} student{studentCount !== 1 ? "s" : ""}
          </p>
        </div>
        <GraduationCap size={110} className="absolute right-6 top-4 text-white/5" />
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "My Subjects",    value: subjectCount,          icon: <BookOpen size={20} />,      bg: "bg-navy/10 text-navy" },
          { label: "My Students",    value: studentCount,          icon: <Users size={20} />,         bg: "bg-emerald/10 text-emerald" },
          { label: "Today Attended", value: todayAttendanceCount,  icon: <CalendarDays size={20} />,  bg: "bg-amber/10 text-amber" },
          { label: "Upcoming Exams", value: upcomingExams.length,  icon: <ClipboardList size={20} />, bg: "bg-sky-100 text-sky-700" }
        ].map(({ label, value, icon, bg }) => (
          <Card key={label} className="flex items-center gap-4">
            <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${bg}`}>{icon}</span>
            <div>
              <p className="label-sm text-muted">{label}</p>
              <p className="font-data text-2xl font-bold text-navy">{value}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* My subjects & classes */}
        <Card>
          <h2 className="mb-4 font-heading text-base font-semibold text-navy">My Subjects</h2>
          {subjects.length === 0 ? (
            <p className="text-sm text-muted">No subjects assigned.</p>
          ) : (
            <div className="space-y-2">
              {subjects.map((sub) => (
                <div key={sub.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                  <div>
                    <p className="font-heading font-semibold text-navy">{sub.name}</p>
                    <p className="text-xs text-muted">{sub.class.name} · {sub.class.students.length} students</p>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/attendance?classId=${sub.classId}`}
                      className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-muted hover:border-emerald hover:text-emerald">
                      Attendance
                    </Link>
                    <Link href={`/gradebook`}
                      className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-muted hover:border-emerald hover:text-emerald">
                      Grades
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Upcoming exams */}
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-heading text-base font-semibold text-navy">Upcoming Exams</h2>
            <Link href="/exams" className="text-xs font-semibold text-emerald hover:underline">View All</Link>
          </div>
          {upcomingExams.length === 0 ? (
            <p className="text-sm text-muted">No upcoming exams scheduled.</p>
          ) : (
            <div className="space-y-2">
              {upcomingExams.map((exam) => (
                <Link key={exam.id} href={`/exams/${exam.id}`}
                  className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 transition hover:bg-emerald/5">
                  <div>
                    <p className="font-heading font-semibold text-navy">{exam.subject.name}</p>
                    <p className="text-xs text-muted">{exam.class.name}</p>
                  </div>
                  <p className="text-xs font-semibold text-muted">
                    {new Date(exam.scheduledAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Recent grades entered */}
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-base font-semibold text-navy">Recently Entered Grades</h2>
          <Link href="/gradebook" className="text-xs font-semibold text-emerald hover:underline">View All</Link>
        </div>
        {recentGrades.length === 0 ? (
          <p className="text-sm text-muted">No grades entered yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-xs font-semibold text-muted">
              <tr>
                <th className="pb-2">Student</th>
                <th className="pb-2">Subject</th>
                <th className="pb-2 text-center">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {recentGrades.map((g) => (
                <tr key={g.id}>
                  <td className="py-2 font-semibold text-navy">{g.student.firstName} {g.student.lastName}</td>
                  <td className="py-2 text-muted">{g.subject.name}</td>
                  <td className="py-2 text-center font-data font-semibold text-navy">{g.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { href: "/attendance",  label: "Record Attendance", color: "bg-emerald text-white" },
          { href: "/gradebook",   label: "Enter Grades",      color: "bg-navy text-white" },
          { href: "/exams",       label: "Schedule Exam",     color: "bg-amber text-white" },
          { href: "/report-cards", label: "Report Cards",     color: "bg-slate-700 text-white" }
        ].map(({ href, label, color }) => (
          <Link key={href} href={href}
            className={`rounded-2xl px-4 py-4 text-center text-sm font-semibold transition hover:opacity-90 ${color}`}>
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
