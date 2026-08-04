/**
 * PayrollScreen — desktop view for Payroll Management.
 */
import { redirect } from "next/navigation";
import { getCurrentUser } from "@backend/auth/cookies";
import { listStaffWithSalaries, listPayslips } from "@backend/services/payroll.service";
import { PayrollContent } from "./PayrollContent";
import { MobilePayrollContent } from "@/screens/mobile/MobilePayrollContent/MobilePayrollContent";

export const dynamic = "force-dynamic";

export async function PayrollScreen() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "super_admin" && user.role !== "principal")) redirect("/dashboard");
  const [staffList, payslips] = await Promise.all([listStaffWithSalaries(), listPayslips()]);
  return (
    <>
      <div className="mobileOnly">
        <MobilePayrollContent staffList={staffList} initialPayslips={payslips} />
      </div>
      <div className="desktopOnly">
        <PayrollContent staffList={staffList} initialPayslips={payslips} />
      </div>
    </>
  );
}
