import { getSettings } from "@backend/services/settings.service";
import { listAcademicYears } from "@backend/services/academic.service";
import { SettingsScreen } from "@/screens/desktop/SettingsScreen/SettingsScreen";

export default async function Page() {
  const [s, years] = await Promise.all([getSettings(), listAcademicYears()]);

  const academicYears = years.map((y) => ({
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

  return (
    <SettingsScreen
      initialSettings={{
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
      }}
      academicYears={academicYears}
    />
  );
}
