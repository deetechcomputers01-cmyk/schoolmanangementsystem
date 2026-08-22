import { getSettings } from "@backend/services/settings.service";
import { ResetPasswordScreen } from "@/screens/desktop/ResetPasswordScreen/ResetPasswordScreen";
import { MobileForgotPasswordScreen } from "@/screens/mobile/MobileAuth/MobileForgotPasswordScreen";

export default async function ForgotPasswordPage() {
  const settings = await getSettings();
  const schoolName = settings.name || undefined;
  return (
    <>
      <div className="mobileOnly">
        <MobileForgotPasswordScreen schoolName={schoolName} />
      </div>
      <div className="desktopOnly">
        <ResetPasswordScreen schoolName={schoolName} />
      </div>
    </>
  );
}
