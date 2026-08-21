import { getSettings } from "@backend/services/settings.service";
import { listAcademicYears } from "@backend/services/academic.service";
import { getClasses } from "@backend/services/dashboard.service";
import { listFeeStructure } from "@backend/services/feeStructure.service";
import type { SettingsData, YearData } from "./useSettingsForm";

/**
 * Shared server-side data loader for every /settings route (the root page,
 * the settings layout's mobile SettingsFormProvider, and each per-section
 * page's desktop SettingsScreen render) — one place to fetch+map instead of
 * four copies drifting apart.
 */
export async function loadSettingsPageData() {
  const [s, years, classesRaw, feeStructureRowsRaw] = await Promise.all([
    getSettings(), listAcademicYears(), getClasses(), listFeeStructure(),
  ]);
  const classes = classesRaw.map((c) => ({ id: c.id, name: c.name }));
  const feeStructureRows = feeStructureRowsRaw.map((r) => ({
    id: r.id, classId: r.classId, term: r.term, category: r.category,
    amount: Number(r.amount), class: r.class,
  }));

  const academicYears: YearData[] = years.map((y) => ({
    id: y.id,
    name: y.name,
    startDate: y.startDate.toISOString().slice(0, 10),
    endDate: y.endDate.toISOString().slice(0, 10),
    isCurrent: y.isCurrent,
    terms: y.terms.map((t) => ({
      id: t.id,
      name: t.name,
      startDate: t.startDate.toISOString().slice(0, 10),
      endDate: t.endDate.toISOString().slice(0, 10),
      isCurrent: t.isCurrent,
    })),
  }));

  const initialSettings: SettingsData = {
    name:         s.name,
    address:      s.address,
    motto:        s.motto,
    phone:        s.phone,
    email:        s.email,
    logoUrl:      s.logoUrl ?? null,
    letterheadUrl: s.letterheadUrl ?? null,
    reportFooter: s.reportFooter,
    timezone:     s.timezone,
    extra:        (s.extra ?? null) as Record<string, unknown> | null,
    gradingScale: s.gradingScale as { grade: string; min: number; max: number; remark?: string }[],
    updatedAt:    s.updatedAt.toISOString(),
  };

  return { initialSettings, academicYears, classes, feeStructureRows };
}
