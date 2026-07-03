/**
 * ExamsScreen — desktop view for Examinations.
 */
import Link from "next/link";
import { CalendarDays, ClipboardList, Users } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { listExams } from "@/lib/services/exam.service";
import { getCurrentUser } from "@/lib/auth/cookies";
import { getCurrentAcademicContext } from "@/lib/services/academic.service";
import { ExamCreateButton } from "@/components/modules/exams/ExamCreateButton";
import { prisma } from "@/lib/prisma";
import styles from "./ExamsScreen.module.css";

export const dynamic = "force-dynamic";

function fmt(d: Date | string) {
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export async function ExamsScreen() {
  const [user, context, exams, classes, subjects] = await Promise.all([
    getCurrentUser(),
    getCurrentAcademicContext(),
    listExams(),
    prisma.class.findMany({ orderBy: { name: "asc" } }),
    prisma.subject.findMany({ orderBy: { name: "asc" }, include: { class: { select: { name: true } } } }),
  ]);
  const canManage = user?.role === "super_admin" || user?.role === "principal" || user?.role === "teacher";
  return (
    <div className={styles.root}>
      <section className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <p className="label-sm text-emerald">Assessment</p>
          <h1 className="font-heading text-[32px] font-semibold leading-10 text-navy">Examinations</h1>
        </div>
        {canManage && <ExamCreateButton classes={classes} subjects={subjects} terms={context.year?.terms ?? []} />}
      </section>
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
        <Card className="flex items-center gap-4">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-navy/5 text-navy"><ClipboardList size={20} /></span>
          <div><p className="label-sm text-muted">Total Exams</p><p className="font-data text-2xl font-semibold text-navy">{exams.length}</p></div>
        </Card>
        <Card className="flex items-center gap-4">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-emerald/10 text-emerald"><Users size={20} /></span>
          <div><p className="label-sm text-muted">Active Term</p><p className="font-heading text-base font-semibold text-navy">{context.term?.name ?? "None"}</p></div>
        </Card>
        <Card className="flex items-center gap-4">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-amber/10 text-amber"><CalendarDays size={20} /></span>
          <div><p className="label-sm text-muted">Academic Year</p><p className="font-heading text-base font-semibold text-navy">{context.year?.name ?? "None"}</p></div>
        </Card>
      </div>
      <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-soft">
        <div className="border-b border-line px-6 py-4">
          <h2 className="font-heading text-lg font-semibold text-navy">All Examinations</h2>
        </div>
        {exams.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <ClipboardList size={40} className="mb-3 text-muted/30" />
            <p className="font-heading font-semibold text-navy">No exams scheduled yet</p>
            <p className="mt-1 text-sm text-muted">{canManage ? "Click New Exam to schedule one." : "Check back later."}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-muted">
                <tr>
                  <th className="px-6 py-3">Title</th><th className="px-6 py-3">Class</th><th className="px-6 py-3">Subject</th>
                  <th className="px-6 py-3">Term</th><th className="px-6 py-3">Date</th><th className="px-6 py-3">Max</th>
                  <th className="px-6 py-3">Scored</th><th className="px-6 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {exams.map((exam) => (
                  <tr key={exam.id} className="transition hover:bg-slate-50">
                    <td className="px-6 py-4 font-semibold text-navy">{exam.title}</td>
                    <td className="px-6 py-4 text-muted">{exam.class.name}</td>
                    <td className="px-6 py-4 text-muted">{exam.subject.name}</td>
                    <td className="px-6 py-4">{exam.term ? <Badge tone="neutral">{exam.term.name}</Badge> : <span className="text-muted">—</span>}</td>
                    <td className="px-6 py-4 text-muted">{fmt(exam.scheduledAt)}</td>
                    <td className="px-6 py-4 font-data font-semibold text-navy">{exam.maxScore}</td>
                    <td className="px-6 py-4"><Badge tone={exam._count.scores > 0 ? "success" : "warning"}>{exam._count.scores} scored</Badge></td>
                    <td className="px-6 py-4">
                      <Link href={`/exams/${exam.id}`} className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-navy transition hover:border-emerald hover:text-emerald">
                        {canManage ? "Enter Scores" : "View"}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}