/**
 * ReportCardsScreen — desktop view for Report Cards.
 */
import { getCurrentAcademicContext } from "@backend/services/academic.service";
import { prisma } from "@backend/prisma";
import { ReportCardsClient } from "./ReportCardsClient";
import { MobileReportCardsContent } from "@/screens/mobile/MobileReportCardsContent/MobileReportCardsContent";
import styles from "./ReportCardsScreen.module.css";

export const dynamic = "force-dynamic";

export async function ReportCardsScreen() {
  const [context, years, classes, grades] = await Promise.all([
    getCurrentAcademicContext(),
    prisma.academicYear.findMany({
      orderBy: { startDate: "desc" },
      include: { terms: { orderBy: { startDate: "asc" } } },
    }),
    prisma.class.findMany({
      where: { isActive: true },
      orderBy: [{ order: { sort: "asc", nulls: "last" } }, { name: "asc" }],
      include: {
        students: {
          orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
          select: { id: true, firstName: true, lastName: true, admissionNo: true },
        },
      },
    }),
    prisma.grade.findMany({ select: { studentId: true, term: true, score: true } }),
  ]);

  // Per-student, per-term average — computed once here so the client can switch
  // the Term filter instantly without a round trip.
  const averages = new Map<string, Map<string, number>>();
  const totals = new Map<string, Map<string, { sum: number; count: number }>>();
  for (const g of grades) {
    if (!totals.has(g.studentId)) totals.set(g.studentId, new Map());
    const byTerm = totals.get(g.studentId)!;
    const entry = byTerm.get(g.term) ?? { sum: 0, count: 0 };
    entry.sum += g.score;
    entry.count += 1;
    byTerm.set(g.term, entry);
  }
  for (const [studentId, byTerm] of totals) {
    const perTerm = new Map<string, number>();
    for (const [term, { sum, count }] of byTerm) perTerm.set(term, Math.round((sum / count) * 10) / 10);
    averages.set(studentId, perTerm);
  }

  const classesWithAverages = classes.map((cls) => ({
    id: cls.id,
    name: cls.name,
    students: cls.students.map((s) => ({
      ...s,
      termAverages: Object.fromEntries(averages.get(s.id) ?? []),
    })),
  }));

  const academicContext = `${context.year?.name ?? "No active year"} · ${context.term?.name ?? "No active term"}`;

  const props = {
    classes: classesWithAverages,
    years: years.map((y) => ({ id: y.id, name: y.name, terms: y.terms.map((t) => ({ id: t.id, name: t.name })) })),
    currentYearId: context.year?.id ?? null,
    currentTermName: context.term?.name ?? null,
    academicContext,
  };

  return (
    <div className={styles.root}>
      <div className="mobileOnly">
        <MobileReportCardsContent {...props} />
      </div>
      <div className="desktopOnly">
        <ReportCardsClient {...props} />
      </div>
    </div>
  );
}
