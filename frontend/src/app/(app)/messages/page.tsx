import { redirect } from "next/navigation";
import { getCurrentUser } from "@backend/auth/cookies";
import { MessagesScreen } from "@/screens/desktop/MessagesScreen/MessagesScreen";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  if (!["guardian", "teacher", "principal", "super_admin"].includes(user.role)) {
    redirect("/dashboard");
  }

  return (
    <MessagesScreen userId={user.id} userRole={user.role} userName={user.name} />
  );
}
