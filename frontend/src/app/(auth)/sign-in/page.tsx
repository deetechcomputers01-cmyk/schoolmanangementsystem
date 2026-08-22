import { getSettings } from "@backend/services/settings.service";
import { LoginScreen } from "@/screens/desktop/LoginScreen/LoginScreen";
import { MobileSignInScreen } from "@/screens/mobile/MobileAuth/MobileSignInScreen";

export default async function SignInPage() {
  const settings = await getSettings();
  const schoolName = settings.name || undefined;
  return (
    <>
      <div className="mobileOnly">
        <MobileSignInScreen schoolName={schoolName} />
      </div>
      <div className="desktopOnly">
        <LoginScreen schoolName={schoolName} />
      </div>
    </>
  );
}
