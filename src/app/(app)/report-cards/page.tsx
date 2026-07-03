/**
 * report-cards/page.tsx — entry point for /report-cards.
 */
import { headers } from "next/headers";
import { getDeviceType } from "@/lib/device";
import { ReportCardsScreen }        from "@/screens/desktop/ReportCardsScreen/ReportCardsScreen";
import { MobileReportCardsScreen }  from "@/screens/mobile/MobileReportCardsScreen/MobileReportCardsScreen";

export default function ReportCardsPage() {
  const ua     = headers().get("user-agent") ?? "";
  const device = getDeviceType(ua);
  return device === "mobile" ? <MobileReportCardsScreen /> : <ReportCardsScreen />;
}