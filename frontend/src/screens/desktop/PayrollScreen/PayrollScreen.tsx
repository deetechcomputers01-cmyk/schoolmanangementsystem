/**
 * PayrollScreen — desktop view for Payroll Management.
 */
import { redirect } from "next/navigation";
import { getCurrentUser } from "@backend/auth/cookies";
import { listStaffWithSalaries, listPayslips } from "@backend/services/payroll.service";
import { PayrollContent } from "./PayrollContent";

export const dynamic = "force-dynamic";

export async function PayrollScreen() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "super_admin" && user.role !== "principal")) redirect("/dashboard");
  const [staffList, payslips] = await Promise.all([listStaffWithSalaries(), listPayslips()]);
  return <PayrollContent staffList={staffList} initialPayslips={payslips} />;
}
