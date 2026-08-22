import { getSettings } from "@backend/services/settings.service";
import { ResetPasswordScreen } from "@/screens/desktop/ResetPasswordScreen/ResetPasswordScreen";

export default async function ForgotPasswordPage() {
  const settings = await getSettings();
  return <ResetPasswordScreen schoolName={settings.name || undefined} />;
}
