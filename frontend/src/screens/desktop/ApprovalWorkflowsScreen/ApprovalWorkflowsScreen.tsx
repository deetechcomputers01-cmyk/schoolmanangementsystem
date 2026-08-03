import { redirect } from "next/navigation";
import { getCurrentUser } from "@backend/auth/cookies";
import { ApprovalWorkflowsContent } from "./ApprovalWorkflowsContent";

export const dynamic = "force-dynamic";

export async function ApprovalWorkflowsScreen() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return <ApprovalWorkflowsContent isAdmin={user.role === "super_admin" || user.role === "principal"} />;
}
