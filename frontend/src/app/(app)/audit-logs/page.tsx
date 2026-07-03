/**
 * audit-logs/page.tsx — entry point for /audit-logs.
 * Detects device; renders desktop or mobile AuditLogsScreen.
 */
import { headers } from "next/headers";
import { getDeviceType } from "@/lib/device";
import { AuditLogsScreen }        from "@/screens/desktop/AuditLogsScreen/AuditLogsScreen";
import { MobileAuditLogsScreen }  from "@/screens/mobile/MobileAuditLogsScreen/MobileAuditLogsScreen";

export default function AuditLogsPage() {
  const ua     = headers().get("user-agent") ?? "";
  const device = getDeviceType(ua);
  return device === "mobile" ? <MobileAuditLogsScreen /> : <AuditLogsScreen />;
}
