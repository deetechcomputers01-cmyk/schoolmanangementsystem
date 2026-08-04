import { redirect } from "next/navigation";
import { getCurrentUser } from "@backend/auth/cookies";
import { ApprovalWorkflowsContent } from "./ApprovalWorkflowsContent";
import { MobileApprovalWorkflowsContent } from "@/screens/mobile/MobileApprovalWorkflowsContent/MobileApprovalWorkflowsContent";

export const dynamic = "force-dynamic";

export async function ApprovalWorkflowsScreen() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const isAdmin = user.role === "super_admin" || user.role === "principal";
  return (
    <>
      <div className="mobileOnly">
        <MobileApprovalWorkflowsContent isAdmin={isAdmin} />
      </div>
      <div className="desktopOnly">
        <ApprovalWorkflowsContent isAdmin={isAdmin} />
      </div>
    </>
  );
}
