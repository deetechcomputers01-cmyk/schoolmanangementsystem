// @ts-nocheck
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { currency, gradeFromScore } from "@backend/utils";
import {
  BookOpen, CalendarDays, CheckCircle2, GraduationCap,
  Receipt, XCircle, AlertCircle, Clock, Phone, Users,
  Home, Utensils, BellRing, ClipboardList
} from "lucide-react";

type ChildData = {
  id: string; firstName: string; lastName: string; admissionNo: string;
  className: string; house: string | null; attendance: number; classAverage: number; feeBalance: number;
  timetable: Array<{ id: string; day: string; startsAt: string; endsAt: string; room: string | null; subject: { name: string } }>;
  upcomingExams: Array<{ scheduledAt: Date; subject: { name: string } }>;
  subjects: Array<{ id: string; name: string; staff?: { firstName: string; lastName: string } | null }>;
  feeRecords: Array<{ id: string; amountDue: number; status: string; payments: Array<{ amount: number }> }>;
  recentGrades: Array<{ id: string; score: number; subject: { name: string } }>;
  recentExamScores: Array<{ id: string; score: number; exam?: { subjectId: string } | null }>;
  activeTerm: { id: string; name: string; academicYear?: { name: string } | null } | null;
};

type Props = {
  data: {
    guardian: { id: string; name: string; relation: string; phone: string; email: string | null };
    children: ChildData[];
    announcements: Array<{ id: string; title: string; body: string; isPinned: boolean; publishedAt: Date }>;
    mealMenus: Array<{ day: string; mealType: string; items: string[] }>;
    weekOf: string;
    gradingScale?: unknown;
  } | null;
};

const ATTENDANCE_ICON: Record<string, React.ReactNode> = {
  present: <CheckCircle2 size={14} className="text-emerald" />,
  absent:  <XCircle      size={14} className="text-rose-500" />,
  late:    <Clock        size={14} className="text-amber" />,
  excused: <AlertCircle  size={14} className="text-sky-500" />
};

const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const MEAL_ORDER = ["Breakfast", "Lunch", "Dinner"];

function fmt(date: Date | string) {
  return new Date(date).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

export function GuardianPortal({ data }: Props) {
  if (!data) return null;

  const d = data as any;
  const { guardian, announcements, mealMenus, gradingScale } = d;
  const child = d.children?.[0];
  if (!child) return null;

  const student       = { ...child, class: { name: child.className, timetable: child.timetable ?? [] }, boardingType: child.house ? "boarder" : "day", boardingHouse: child.house, boardingRoom: null, gender: "—" };
  const activeTerm    = child.activeTerm;
  const attendance    = child.recentAttendance ?? [];
  const grades        = (child.recentGrades ?? []).map((g: any) => ({ ...g, subjectId: g.subject?.id ?? "" }));
  const examScores    = child.recentExamScores ?? [];
  const feeRecords    = (child.feeRecords ?? []).map((f: any) => ({ ...f, description: "School Fees", term: activeTerm?.name ?? "—" }));
  const upcomingExams = (child.upcomingExams ?? []).map((e: any) => ({ ...e, id: e.scheduledAt?.toString(), title: e.subject?.name ?? "Exam", maxScore: 100 }));

  const present  = Math.round((child.attendance / 100) * 30);
  const total    = 30;
  const attPct   = child.attendance ?? 0;

  const gradeAvg = grades.length
    ? (grades.reduce((s: number, g: any) => s + g.score, 0) / grades.length).toFixed(1)
    : "—";

  const outstanding = child.feeBalance ?? 0;

  const examMap: Record<string, number> = {};
  for (const es of examScores) {
    if ((es as any).exam?.subjectId) examMap[(es as any).exam.subjectId] = (es as any).score;
  }

  // Group meals by day
  const mealsByDay: Record<string, Record<string, string[]>> = {};
  for (const m of mealMenus ?? []) {
    if (!mealsByDay[m.day]) mealsByDay[m.day] = {};
    mealsByDay[m.day][m.mealType] = m.items;
  }
  const todayName = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][new Date().getDay()];
  const todayMeals = mealsByDay[todayName] ?? null;
  void present; void total; void attPct;

  const isBoarger = student.boardingType === "boarder";

  return (
    <div className="space-y-6">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-navy px-8 py-8 text-white">
        <div className="relative z-10">
          <p className="text-sm text-slate-400">Welcome back, {guardian.name}</p>
          <h1 className="mt-1 font-heading text-3xl font-bold">Parent Portal</h1>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Badge roleName="guardian">{guardian.relation}</Badge>
            <span className="text-sm text-slate-400">
              Viewing: <span className="font-semibold text-white">{student.firstName} {student.lastName}</span>
            </span>
            {activeTerm && (
              <span className="rounded-full bg-white/10 px-3 py-0.5 text-xs font-semibold">
                {activeTerm.academicYear?.name} · {activeTerm.name}
              </span>
            )}
          </div>
        </div>
        <Users size={120} className="absolute right-6 top-4 text-white/5" />
      </div>

      {/* ── Child info card ───────────────────────────────────────────────── */}
      <Card className="flex flex-wrap items-center gap-6">
        <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-navy text-2xl font-bold text-white">
          {student.firstName[0]}{student.lastName[0]}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-heading text-lg font-semibold text-navy">
            {student.firstName} {student.lastName}
          </p>
          <div className="mt-1 flex flex-wrap gap-3 text-sm text-muted">
            <span className="flex items-center gap-1"><GraduationCap size={13} /> {student.class.name}</span>
            <span>Adm: {student.admissionNo}</span>
            <span>{student.gender}</span>
          </div>
        </div>
        {/* Boarding status */}
        <div className="flex items-center gap-2">
          <span className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
            isBoarger ? "bg-sky-50 text-sky-700" : "bg-slate-100 text-slate-600"
          }`}>
            <Home size={12} />
            {isBoarger ? "Boarder" : "Day Student"}
          </span>
          {isBoarger && student.boardingHouse && (
            <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
              {student.boardingHouse}
            </span>
          )}
          {isBoarger && student.boardingRoom && (
            <span className="text-xs text-muted">{student.boardingRoom}</span>
          )}
        </div>
      </Card>

      {/* ── Stat cards ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={<CheckCircle2 size={20} className="text-emerald" />} bg="bg-emerald/10"
          label="Attendance Rate" value={`${attPct}%`}
          sub={`${present} of ${total} days present`}
        />
        <StatCard
          icon={<BookOpen size={20} className="text-navy" />} bg="bg-navy/10"
          label="Class Score Avg" value={gradeAvg === "—" ? "—" : `${gradeAvg}%`}
          sub={`${grades.length} subject${grades.length !== 1 ? "s" : ""} recorded`}
        />
        <StatCard
          icon={<Receipt size={20} className="text-amber" />} bg="bg-amber/10"
          label="Outstanding Fees" value={currency(outstanding)}
          sub={outstanding > 0 ? "Payment required" : "All fees paid ✓"}
        />
      </div>

      {/* ── Announcements ─────────────────────────────────────────────────── */}
      {announcements.length > 0 && (
        <Card>
          <h2 className="mb-4 flex items-center gap-2 font-heading text-base font-semibold text-navy">
            <BellRing size={16} /> School Notices
          </h2>
          <div className="space-y-3">
            {announcements.map((a) => (
              <div key={a.id} className={`rounded-xl border p-3 ${a.isPinned ? "border-amber/40 bg-amber/5" : "border-line bg-slate-50"}`}>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-navy">{a.title}</p>
                  {a.isPinned && <span className="shrink-0 rounded-full bg-amber/20 px-2 py-0.5 text-[10px] font-bold text-amber">Pinned</span>}
                </div>
                <p className="mt-1 text-xs text-muted line-clamp-2">{a.body}</p>
                <p className="mt-1.5 text-[11px] text-muted/60">{fmt(a.publishedAt)}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ── Academic performance ─────────────────────────────────────────── */}
        <Card>
          <h2 className="mb-4 flex items-center gap-2 font-heading text-base font-semibold text-navy">
            <BookOpen size={16} /> Academic Performance
            {activeTerm && <span className="ml-auto text-xs font-normal text-muted">{activeTerm.name}</span>}
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
                  const grade = gradeFromScore(total, 100, gradingScale);
                  return (
                    <tr key={g.id}>
                      <td className="py-2 font-medium text-navy">{g.subject.name}</td>
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
        </Card>

        {/* ── Upcoming Exams ───────────────────────────────────────────────── */}
        <Card>
          <h2 className="mb-4 flex items-center gap-2 font-heading text-base font-semibold text-navy">
            <ClipboardList size={16} /> Upcoming Exams
          </h2>
          {upcomingExams.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted">No upcoming exams scheduled.</p>
          ) : (
            <div className="space-y-2">
              {upcomingExams.map((e) => (
                <div key={e.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5">
                  <div>
                    <p className="text-sm font-semibold text-navy">{e.title}</p>
                    <p className="text-xs text-muted">{e.subject.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-navy">{fmt(e.scheduledAt)}</p>
                    <p className="text-[11px] text-muted">Max: {e.maxScore} marks</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* ── Attendance Log ───────────────────────────────────────────────── */}
      <Card>
        <h2 className="mb-4 flex items-center gap-2 font-heading text-base font-semibold text-navy">
          <CalendarDays size={16} /> Recent Attendance
        </h2>
        {attendance.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted">No attendance records yet.</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {attendance.slice(0, 10).map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                <div className="flex items-center gap-2">
                  {ATTENDANCE_ICON[a.status]}
                  <span className="text-sm capitalize text-navy">{a.status}</span>
                  {a.note && <span className="text-xs text-muted">— {a.note}</span>}
                </div>
                <span className="text-xs text-muted">{fmt(a.date)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ── Boarding Info (boarders only) ─────────────────────────────────── */}
      {isBoarger && (
        <Card>
          <h2 className="mb-4 flex items-center gap-2 font-heading text-base font-semibold text-navy">
            <Home size={16} /> Boarding Information
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <InfoRow label="Status"       value="In Residence" badge="bg-emerald/10 text-emerald" />
            <InfoRow label="House"        value={student.boardingHouse ?? "—"} />
            <InfoRow label="Room"         value={student.boardingRoom  ?? "—"} />
          </div>
          <div className="mt-4 rounded-xl bg-sky-50 px-4 py-3 text-sm text-sky-700">
            <p className="font-semibold">Boarding Matron Contact</p>
            <p className="mt-0.5 text-xs">For welfare enquiries call the school office: <a href="tel:+233200000000" className="font-bold underline">+233 20 000 0000</a></p>
          </div>
        </Card>
      )}

      {/* ── Canteen / Meal Schedule ──────────────────────────────────────── */}
      {mealMenus.length > 0 && (
        <Card>
          <h2 className="mb-4 flex items-center gap-2 font-heading text-base font-semibold text-navy">
            <Utensils size={16} /> {isBoarger ? "Boarding Meal Schedule" : "Canteen Menu"} — This Week
          </h2>

          {/* Today highlight */}
          {todayMeals && (
            <div className="mb-4 rounded-xl bg-emerald/5 border border-emerald/20 p-3">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-emerald">Today — {todayName}</p>
              <div className="flex flex-wrap gap-4">
                {MEAL_ORDER.filter(m => todayMeals[m]).map(meal => (
                  <div key={meal}>
                    <p className="text-[11px] font-semibold uppercase text-muted">{meal}</p>
                    <p className="text-sm text-navy">{todayMeals[meal].join(", ")}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Full week table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-[11px] font-semibold text-muted">
                  <th className="pb-2 pr-4">Day</th>
                  {MEAL_ORDER.filter(m => !isBoarger ? m !== "Dinner" : true).map(m => (
                    <th key={m} className="pb-2 pr-4">{m}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {DAY_ORDER.filter(d => mealsByDay[d]).map(day => (
                  <tr key={day} className={day === todayName ? "bg-emerald/5" : ""}>
                    <td className={`py-2 pr-4 font-semibold ${day === todayName ? "text-emerald" : "text-navy"}`}>{day.slice(0,3)}</td>
                    {MEAL_ORDER.filter(m => !isBoarger ? m !== "Dinner" : true).map(meal => (
                      <td key={meal} className="py-2 pr-4 text-muted">
                        {(mealsByDay[day]?.[meal] ?? []).join(", ") || "—"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ── Fee Records ─────────────────────────────────────────────────── */}
      {feeRecords.length > 0 && (
        <Card>
          <h2 className="mb-4 flex items-center gap-2 font-heading text-base font-semibold text-navy">
            <Receipt size={16} /> Fee Records
          </h2>
          <table className="w-full text-sm">
            <thead className="text-left text-xs font-semibold text-muted">
              <tr>
                <th className="pb-2">Description</th>
                <th className="pb-2">Term</th>
                <th className="pb-2 text-right">Due</th>
                <th className="pb-2 text-right">Paid</th>
                <th className="pb-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {feeRecords.map((f) => {
                const paid = f.payments.reduce((s, p) => s + Number(p.amount), 0);
                return (
                  <tr key={f.id}>
                    <td className="py-2 font-medium text-navy">{f.description}</td>
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

      {/* ── Class Timetable ──────────────────────────────────────────────── */}
      {student.class.timetable.length > 0 && (
        <Card>
          <h2 className="mb-4 flex items-center gap-2 font-heading text-base font-semibold text-navy">
            <CalendarDays size={16} /> Class Timetable — {student.class.name}
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs font-semibold text-muted">
                <tr><th className="pb-2">Day</th><th className="pb-2">Subject</th><th className="pb-2">Time</th><th className="pb-2">Room</th></tr>
              </thead>
              <tbody className="divide-y divide-line">
                {student.class.timetable.map((slot) => (
                  <tr key={slot.id}>
                    <td className="py-2 font-semibold text-navy">{slot.day}</td>
                    <td className="py-2 text-muted">{slot.subject.name}</td>
                    <td className="py-2 font-data text-muted">{slot.startsAt}–{slot.endsAt}</td>
                    <td className="py-2 text-muted">{slot.room ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ── Contact ──────────────────────────────────────────────────────── */}
      <Card className="flex items-center justify-between gap-4">
        <div>
          <p className="font-heading font-semibold text-navy">Need to speak to the school?</p>
          <p className="text-sm text-muted">Administration office is available Mon–Fri, 7:30 AM – 4:00 PM.</p>
        </div>
        <a href="tel:+233200000000"
          className="flex shrink-0 items-center gap-2 rounded-xl bg-emerald px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald/90 transition">
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
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
        <p className="font-data text-2xl font-bold text-navy">{value}</p>
        <p className="text-xs text-muted">{sub}</p>
      </div>
    </Card>
  );
}

function InfoRow({ label, value, badge }: { label: string; value: string; badge?: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">{label}</p>
      {badge
        ? <span className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-xs font-bold ${badge}`}>{value}</span>
        : <p className="mt-0.5 text-sm font-semibold text-navy">{value}</p>}
    </div>
  );
}
