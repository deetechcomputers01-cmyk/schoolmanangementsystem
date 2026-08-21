import { loadSettingsPageData } from "@/screens/desktop/SettingsScreen/loadSettingsPageData";
import { SettingsFormProvider } from "@/screens/mobile/MobileSettingsContent/SettingsFormContext";

/**
 * Settings route layout — fetches the same data `/settings/page.tsx` needs
 * for the desktop screen, and additionally feeds it into SettingsFormProvider
 * so the mobile section pages (`/settings/<section>`) share one form/dirty
 * state across navigations. Next.js keeps this layout mounted while its
 * child routes swap, which is what makes that sharing possible.
 */
export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const { initialSettings, academicYears, classes, feeStructureRows } = await loadSettingsPageData();

  return (
    <SettingsFormProvider
      initialSettings={initialSettings}
      academicYears={academicYears}
      classes={classes}
      feeStructureRows={feeStructureRows}
    >
      {children}
    </SettingsFormProvider>
  );
}
