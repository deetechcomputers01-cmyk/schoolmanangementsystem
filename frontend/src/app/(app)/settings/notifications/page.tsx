import { loadSettingsPageData } from "@/screens/desktop/SettingsScreen/loadSettingsPageData";
import { SettingsScreen } from "@/screens/desktop/SettingsScreen/SettingsScreen";
import { MobileSettingsSectionPage } from "@/screens/mobile/MobileSettingsContent/MobileSettingsSectionPage";

/**
 * Notifications settings section. Mobile gets its own focused page
 * (MobileSettingsSectionPage, state shared via SettingsFormContext from the
 * settings layout); desktop renders the real SettingsScreen with this
 * section pre-selected — so resizing the window (or a bookmarked/deep
 * link) between mobile and desktop widths always shows real content on both
 * sides, never a "wrong device" placeholder.
 */
export default async function Page() {
  const { initialSettings, academicYears, classes, feeStructureRows } = await loadSettingsPageData();

  return (
    <>
      <div className="mobileOnly">
        <MobileSettingsSectionPage section="notifications" />
      </div>
      <div className="desktopOnly">
        <SettingsScreen
          initialSettings={initialSettings}
          academicYears={academicYears}
          classes={classes}
          feeStructureRows={feeStructureRows}
          initialSection="notifications"
        />
      </div>
    </>
  );
}
