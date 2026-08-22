import { Suspense } from "react";
import { getSettings } from "@backend/services/settings.service";
import { MobileEnterOtpScreen } from "@/screens/mobile/MobileAuth/MobileEnterOtpScreen";

export default async function EnterOtpPage() {
  const settings = await getSettings();
  return (
    <Suspense fallback={null}>
      <MobileEnterOtpScreen schoolName={settings.name || undefined} />
    </Suspense>
  );
}
