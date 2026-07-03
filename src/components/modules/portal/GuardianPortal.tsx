import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { currency, gradeFromScore } from "@backend/utils";
import {
  BookOpen, CalendarDays, CheckCircle2, GraduationCap,
  Receipt, XCircle, AlertCircle, Clock, Phone, Users
} from "lucide-react";

type Props = { data: Awaited<ReturnType<typeof import("@backend/services/portal.service").getGuardianPortalData>> };

const statusIcon: Record<string, React.ReactNode> = {
  present:  <CheckCircle2 size={14} className="text-emerald" />,
  absent:   <XCircle      size={14} className="text-rose-500" />,
  late:     <Clock        size={14} className="text-amber" />,
  excused:  <AlertCircle  size={14} className="text-sky-500" />
};

export function GuardianPortal({ data }: Props) {
  const { guardian, student, activeTerm, attendance, grades, examScores, feeRecords } = data;

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

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-navy px-8 py-8 text-white">
        <div className="relative z-10">
          <p className="text-sm text-slate-400">Welcome, {guardian.name}</p>
          <h1 className="mt-1 font-heading text-3xl font-bold">Parent Portal</h1>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Badge roleName="guardian">{guardian.relation}</Badge>
            <span className="text-sm text-slate-400">
              Viewing: {student.firstName} {student.lastName}
            </span>
          </div>
        </div>
        <Users size={120} className="absolute right-6 top-4 text-white/5" />
      </div>

      {/* Child info card */}
      <Card className="flex flex-wrap items-center gap-6">
        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-navy text-2xl font-bold text-white">
          {student.firstName[0]}{student.lastName[0]}
        </div>
        <div className="flex-1">
          <p className="font-heading text-lg font-semibold text-navy">
            {student.firstName} {student.lastName}
          </p>
          <div className="mt-1 flex flex-wrap gap-3 text-sm text-muted">
            <span className="flex items-center gap-1.5"><GraduationCap size={14} /> {student.class.name}</span>
            <span>Adm: {student.admissionNo}</span>
            <span>{student.gender}</span>
          </div>
        </div>
        {activeTerm && (
          <div className="text-right">
            <p className="text-xs text-muted">Current Period</p>
            <p className="font-heading font-semibold text-navy">{activeTerm.academicYear?.name}</p>
            <p className="text-sm text-muted">{activeTerm.name}</p>
          </div>
        )}
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={<CheckCircle2 size={20} className="text-emerald" />} bg="bg-emerald/10"
          label="Attendance Rate" value={`${attPct}%`} sub={`${present} of ${total} days present`} />
        <StatCard icon={<BookOpen size={20} className="text-navy" />} bg="bg-navy/10"
          label="Average Class Score" value={`${gradeAvg}%`} sub={`${grades.length} subjects`} />
        <StatCard icon={<Receipt size={20} className="text-amber" />} bg="bg-amber/10"
          label="Outstanding Fees" value={currency(outstanding)}
          sub={outstanding > 0 ? "Payment needed" : "Fully paid"} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Academic performance */}
        <Card>
          <h2 className="mb-4 font-heading text-base font-semibold text-navy flex items-center gap-2">
            <BookOpen size={16} /> Academic Performance — {activeTerm?.name ?? "Current Term"}
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
                  const grade = gradeFromScore(total);
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

        {/* Attendance */}
        <Card>
          <h2 className="mb-4 font-heading text-base font-semibold text-navy flex items-center gap-2">
            <CalendarDays size={16} /> Attendance Log
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
                    {a.note && <span className="text-xs text-muted">— {a.note}</span>}
                  </div>
                  <span className="text-xs text-muted">
                    {new Date(a.date).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

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
                <th className="pb-2 text-right">Amount Due</th>
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
                    <td className="py-2 text-right font-data text-emerald">{currency(paid)}</td>
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

      {/* Contact school */}
      <Card className="flex items-center justify-between gap-4">
        <div>
          <p className="font-heading font-semibold text-navy">Need to contact the school?</p>
          <p className="text-sm text-muted">Reach out to the administration office for any queries.</p>
        </div>
        <a href="tel:+233000000000"
          className="flex items-center gap-2 rounded-xl bg-emerald px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald/80">
          <Phone size={16} /> Call School
        </a>
      </Card>
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
