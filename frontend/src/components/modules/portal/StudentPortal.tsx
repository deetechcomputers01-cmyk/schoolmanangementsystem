import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { currency, gradeFromScore, type GradeBand } from "@backend/utils";
import {
  BookOpen, CalendarDays, CheckCircle2, GraduationCap,
  Receipt, XCircle, AlertCircle, Clock, ClipboardList
} from "lucide-react";
import { OnlineExamsWidget } from "./OnlineExamsWidget";

type Props = { data: Awaited<ReturnType<typeof import("@backend/services/portal.service").getStudentPortalData>> };

const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const statusIcon: Record<string, React.ReactNode> = {
  present:  <CheckCircle2 size={14} className="text-emerald" />,
  absent:   <XCircle      size={14} className="text-rose-500" />,
  late:     <Clock        size={14} className="text-amber" />,
  excused:  <AlertCircle  size={14} className="text-sky-500" />
};

export function StudentPortal({ data }: Props) {
  const { student, activeTerm, attendance, grades, examScores, feeRecords, gradingScale } = data;

  const present  = attendance.filter((a) => a.status === "present").length;
  const total    = attendance.length;
  const attPct   = total ? Math.round((present / total) * 100) : 0;

  const gradeAvg = grades.length
    ? (grades.reduce((s, g) => s + g.score, 0) / grades.length).toFixed(1)
    : "—";

  const outstanding = feeRecords
    .filter((f) => f.status !== "paid")
    .reduce((s, f) => s + (Number(f.amountDue) - f.payments.reduce((p, pay) => p + Number(pay.amount), 0)), 0);

  const examMap: Record<string, number> = {};
  for (const es of examScores) {
    if (es.exam?.subjectId) examMap[es.exam.subjectId] = es.score;
  }

  const timetableByDay = DAY_ORDER.map((day) => ({
    day,
    slots: student.class.timetable.filter((t) => t.day === day)
  })).filter((d) => d.slots.length > 0);

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-navy px-8 py-8 text-white">
        <div className="relative z-10">
          <p className="text-sm text-slate-400">Welcome back</p>
          <h1 className="mt-1 font-heading text-3xl font-bold">
            {student.firstName} {student.lastName}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Badge roleName="student">{student.class.name}</Badge>
            <span className="text-sm text-slate-400">Adm: {student.admissionNo}</span>
            {activeTerm && (
              <span className="text-sm text-slate-400">
                {activeTerm.academicYear?.name} · {activeTerm.name}
              </span>
            )}
          </div>
        </div>
        <GraduationCap size={120} className="absolute right-6 top-4 text-white/5" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={<CheckCircle2 size={20} className="text-emerald" />} bg="bg-emerald/10"
          label="Attendance Rate" value={`${attPct}%`} sub={`${present}/${total} days`} />
        <StatCard icon={<BookOpen size={20} className="text-navy" />} bg="bg-navy/10"
          label="Average Grade" value={`${gradeAvg}%`} sub={`${grades.length} subjects`} />
        <StatCard icon={<Receipt size={20} className="text-amber" />} bg="bg-amber/10"
          label="Outstanding Fees" value={currency(outstanding)}
          sub={outstanding > 0 ? "Payment required" : "All paid"} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Grades + Exams table */}
        <Card>
          <h2 className="mb-4 font-heading text-base font-semibold text-navy flex items-center gap-2">
            <BookOpen size={16} /> Grades — {activeTerm?.name ?? "Current Term"}
          </h2>
          {grades.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted">No grades recorded yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-xs font-semibold text-muted">
                <tr>
                  <th className="pb-2">Subject</th>
                  <th className="pb-2 text-center">CA</th>
                  <th className="pb-2 text-center">Exam</th>
                  <th className="pb-2 text-center">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {grades.map((g) => {
                  const exam  = examMap[g.subjectId] ?? null;
                  const total = exam !== null ? Math.round(g.score * 0.3 + exam * 0.7) : g.score;
                  const grade = gradeFromScore(total, 100, gradingScale as GradeBand[]);
                  return (
                    <tr key={g.id}>
                      <td className="py-2 font-semibold text-navy">{g.subject.name}</td>
                      <td className="py-2 text-center font-data text-muted">{g.score}</td>
                      <td className="py-2 text-center font-data text-muted">{exam ?? "—"}</td>
                      <td className="py-2 text-center">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-bold ${
                          ["A1","B2","B3"].includes(grade) ? "bg-emerald/10 text-emerald"
                          : ["C4","C5","C6"].includes(grade) ? "bg-amber/10 text-amber"
                          : "bg-rose-50 text-rose-600"
                        }`}>{grade}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          <div className="mt-4">
            <Link href={`/report-cards/${student.id}`}
              className="text-xs font-semibold text-emerald hover:underline">
              View Full Report Card →
            </Link>
          </div>
        </Card>

        {/* Recent attendance */}
        <Card>
          <h2 className="mb-4 font-heading text-base font-semibold text-navy flex items-center gap-2">
            <CalendarDays size={16} /> Recent Attendance
          </h2>
          {attendance.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted">No attendance records yet.</p>
          ) : (
            <div className="space-y-2">
              {attendance.slice(0, 8).map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                  <div className="flex items-center gap-2">
                    {statusIcon[a.status]}
                    <span className="text-sm capitalize text-navy">{a.status}</span>
                  </div>
                  <span className="text-xs text-muted">
                    {new Date(a.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Timetable */}
      {timetableByDay.length > 0 && (
        <Card>
          <h2 className="mb-4 font-heading text-base font-semibold text-navy flex items-center gap-2">
            <CalendarDays size={16} /> Class Timetable — {student.class.name}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {timetableByDay.map(({ day, slots }) => (
              <div key={day} className="rounded-xl border border-line p-3">
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">{day}</p>
                {slots.map((s) => (
                  <div key={s.id} className="mb-1.5 rounded-lg bg-navy/5 px-3 py-2">
                    <p className="text-xs font-semibold text-navy">{s.subject.name}</p>
                    <p className="text-[11px] text-muted">{s.startsAt} – {s.endsAt} · {s.room}</p>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Online Exams */}
      <OnlineExamsWidget />

      {/* Fees */}
      {feeRecords.length > 0 && (
        <Card>
          <h2 className="mb-4 font-heading text-base font-semibold text-navy flex items-center gap-2">
            <Receipt size={16} /> Fee Records
          </h2>
          <table className="w-full text-sm">
            <thead className="text-left text-xs font-semibold text-muted">
              <tr>
                <th className="pb-2">Description</th>
                <th className="pb-2">Term</th>
                <th className="pb-2 text-right">Amount</th>
                <th className="pb-2 text-right">Paid</th>
                <th className="pb-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {feeRecords.map((f) => {
                const paid = f.payments.reduce((s, p) => s + Number(p.amount), 0);
                return (
                  <tr key={f.id}>
                    <td className="py-2 font-semibold text-navy">{f.description}</td>
                    <td className="py-2 text-muted">{f.term}</td>
                    <td className="py-2 text-right font-data">{currency(Number(f.amountDue))}</td>
                    <td className="py-2 text-right font-data">{currency(paid)}</td>
                    <td className="py-2">
                      <Badge tone={f.status === "paid" ? "success" : f.status === "partial" ? "warning" : "danger"}>
                        {f.status}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
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
