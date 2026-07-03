/**
 * report-cards/[studentId]/page.tsx — individual student report card.
 */
import { headers } from "next/headers";
import { getDeviceType } from "@/lib/device";
import { ReportCardsScreen } from "@/screens/desktop/ReportCardsScreen/ReportCardsScreen";
import { MobileReportCardsScreen } from "@/screens/mobile/MobileReportCardsScreen/MobileReportCardsScreen";

export default function StudentReportCardPage() {
  const ua     = headers().get("user-agent") ?? "";
  const device = getDeviceType(ua);
  return device === "mobile" ? <MobileReportCardsScreen /> : <ReportCardsScreen />;
}