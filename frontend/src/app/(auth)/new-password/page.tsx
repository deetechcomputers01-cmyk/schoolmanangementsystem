import { getSettings } from "@backend/services/settings.service";
import { MobileNewPasswordScreen } from "@/screens/mobile/MobileAuth/MobileNewPasswordScreen";

export default async function NewPasswordPage() {
  const settings = await getSettings();
  return <MobileNewPasswordScreen schoolName={settings.name || undefined} />;
}
