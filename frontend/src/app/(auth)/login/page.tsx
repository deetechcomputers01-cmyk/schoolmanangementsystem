import { getSettings } from "@backend/services/settings.service";
import { LoginScreen } from "@/screens/desktop/LoginScreen/LoginScreen";

export default async function LoginPage() {
  const settings = await getSettings();
  return <LoginScreen schoolName={settings.name || undefined} />;
}
