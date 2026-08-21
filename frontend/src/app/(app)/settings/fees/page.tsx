import Link from "next/link";
import { MobileSettingsSectionPage } from "@/screens/mobile/MobileSettingsContent/MobileSettingsSectionPage";

/**
 * Mobile-only route for the Fees settings section (see
 * MobileSettingsSectionPage). Desktop keeps everything on one page via
 * SettingsScreen's tabs, so a desktop visitor landing on this URL directly
 * just gets a link back rather than a blank page.
 */
export default function Page() {
  return (
    <>
      <div className="mobileOnly">
        <MobileSettingsSectionPage section="fees" />
      </div>
      <div className="desktopOnly">
        <p style={{ padding: 24 }}>
          This page is part of the mobile Settings experience.{" "}
          <Link href="/settings">Go to Settings</Link>.
        </p>
      </div>
    </>
  );
}
