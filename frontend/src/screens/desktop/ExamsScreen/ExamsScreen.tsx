import { requireRole } from "@backend/auth/page-guard";
import { listExams } from "@backend/services/exam.service";
import { getCurrentAcademicContext } from "@backend/services/academic.service";
import { getSettings } from "@backend/services/settings.service";
import { prisma } from "@backend/prisma";
import { gradeFromScore, gradeRemark, type GradeBand } from "@backend/utils";
import { ExamsContent } from "./ExamsContent";
import { MobileExamsContent } from "@/screens/mobile/MobileExamsContent/MobileExamsContent";

export const dynamic = "force-dynamic";

function passRate(scores: { score: number; maxScore: number }[], scale: GradeBand[]) {
  if (scores.length === 0) return null;
  const passed = scores.filter((s) => gradeRemark(gradeFromScore(s.score, s.maxScore, scale), scale) !== "Fail").length;
  return Math.round((passed / scores.length) * 1000) / 10;
}

export async function ExamsScreen({ initialExamId }: { initialExamId?: string } = {}) {
  await requireRole("super_admin", "principal", "teacher", "staff");

  const now     = new Date();
  const in7days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [exams, ctx, classes, subjects, settings] = await Promise.all([
    listExams(),
    getCurrentAcademicContext(),
    prisma.class.findMany({ where: { isActive: true }, orderBy: [{ order: { sort: "asc", nulls: "last" } }, { name: "asc" }] }),
    prisma.subject.findMany({ orderBy: { name: "asc" }, include: { class: { select: { name: true } }, staff: true } }),
    getSettings(),
  ]);
  const gradingScale = settings.gradingScale as unknown as GradeBand[];

  const examRows = exams.map((e) => {
    const scheduledAt = e.scheduledAt instanceof Date ? e.scheduledAt : new Date(e.scheduledAt);
    return {
      id:                  e.id,
      title:               e.title,
      className:           e.className  ?? "—",
      classId:             e.classId,
      subjectName:         e.subjectName ?? "—",
      subjectId:           e.subjectId,
      termName:            e.termName   ?? null,
      termId:              e.termId     ?? null,
      scheduledAt:         scheduledAt.toISOString(),
      maxScore:            e.maxScore,
      questionTotalMarks:  e.questionTotalMarks,
      scoredCount:         e.scoresCount,
      isOnline:            e.isOnline   ?? false,
      duration:            e.duration   ?? null,
      status:              e.scoresCount > 0 ? ("scored" as const) : ("pending" as const),
      upcoming:            scheduledAt >= now && scheduledAt <= in7days,
    };
  });

  const stats = {
    total:    examRows.length,
    scored:   examRows.filter((e) => e.status === "scored").length,
    pending:  examRows.filter((e) => e.status === "pending").length,
    upcoming: examRows.filter((e) => e.upcoming).length,
    termName: ctx.term?.name ?? "No active term",
    yearName: ctx.year?.name ?? "2026/2027",
  };

  // Recent performance: the most recently-scheduled exam that already has scores.
  const recentScoredExam = examRows.find((e) => e.scoredCount > 0) ?? null;
  let recentPerformance: {
    examTitle: string; className: string; avg: number; high: number; low: number; passRate: number;
  } | null = null;
  if (recentScoredExam) {
    const rows = await prisma.examScore.findMany({ where: { examId: recentScoredExam.id }, select: { score: true } });
    if (rows.length > 0) {
      const values = rows.map((r) => r.score);
      recentPerformance = {
        examTitle: recentScoredExam.title,
        className: recentScoredExam.className,
        avg: Math.round((values.reduce((s, v) => s + v, 0) / values.length) * 10) / 10,
        high: Math.max(...values),
        low: Math.min(...values),
        passRate: passRate(values.map((v) => ({ score: v, maxScore: recentScoredExam.maxScore })), gradingScale) ?? 0,
      };
    }
  }

  // Term-over-term pass-rate comparison (real, from ExamScore — omitted if no prior term exists).
  let termPassRate: { current: number; previous: number | null } | null = null;
  if (ctx.term) {
    const currentScores = await prisma.examScore.findMany({
      where: { exam: { termId: ctx.term.id } },
      select: { score: true, exam: { select: { maxScore: true } } },
    });
    const current = passRate(currentScores.map((s) => ({ score: s.score, maxScore: s.exam.maxScore })), gradingScale);
    let previous: number | null = null;
    const prevTerm = await prisma.term.findFirst({ where: { startDate: { lt: ctx.term.startDate } }, orderBy: { startDate: "desc" } });
    if (prevTerm) {
      const prevScores = await prisma.examScore.findMany({
        where: { exam: { termId: prevTerm.id } },
        select: { score: true, exam: { select: { maxScore: true } } },
      });
      previous = passRate(prevScores.map((s) => ({ score: s.score, maxScore: s.exam.maxScore })), gradingScale);
    }
    if (current !== null) termPassRate = { current, previous };
  }

  const classOptions   = classes.map((c) => ({ id: c.id, name: c.name, level: c.level }));
  const subjectOptions = subjects.map((s) => ({
    id: s.id, name: s.name, code: s.code,
    classId: s.classId,
    teacherName: s.staff ? `${s.staff.firstName} ${s.staff.lastName}` : null,
  }));
  const termOptions = ctx.year?.terms.map((t) => ({ id: t.id, name: t.name })) ?? [];

  return (
    <>
      <div className="mobileOnly">
        <MobileExamsContent
          exams={examRows}
          stats={stats}
          classOptions={classOptions}
          subjectOptions={subjectOptions}
          termOptions={termOptions}
        />
      </div>
      <div className="desktopOnly">
        <ExamsContent
          exams={examRows}
          stats={stats}
          classOptions={classOptions}
          subjectOptions={subjectOptions}
          termOptions={termOptions}
          initialExamId={initialExamId}
          recentPerformance={recentPerformance}
          termPassRate={termPassRate}
        />
      </div>
    </>
  );
}
