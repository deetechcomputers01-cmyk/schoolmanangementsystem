import { loadSettingsPageData } from "@/screens/desktop/SettingsScreen/loadSettingsPageData";
import { SettingsScreen } from "@/screens/desktop/SettingsScreen/SettingsScreen";
import { MobileSettingsContent } from "@/screens/mobile/MobileSettingsContent/MobileSettingsContent";

export default async function Page() {
  const { initialSettings, academicYears, classes, feeStructureRows } = await loadSettingsPageData();

  return (
    <>
      <div className="mobileOnly">
        <MobileSettingsContent />
      </div>
      <div className="desktopOnly">
        <SettingsScreen initialSettings={initialSettings} academicYears={academicYears} classes={classes} feeStructureRows={feeStructureRows} />
      </div>
    </>
  );
}
