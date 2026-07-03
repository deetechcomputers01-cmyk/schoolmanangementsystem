/**
 * PayrollScreen — desktop view for Payroll Management.
 */
import { redirect } from "next/navigation";
import { getCurrentUser } from "@backend/auth/cookies";
import { listStaffWithSalaries, listPayslips } from "@backend/services/payroll.service";
import { PayrollClient } from "@/components/modules/payroll/PayrollClient";
import styles from "./PayrollScreen.module.css";

export const dynamic = "force-dynamic";

export async function PayrollScreen() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "super_admin" && user.role !== "principal")) redirect("/dashboard");
  const [staffList, payslips] = await Promise.all([listStaffWithSalaries(), listPayslips()]);
  return (
    <div className={styles.root}>
      <section className="mb-6">
        <p className="label-sm text-emerald">Human Resources</p>
        <h1 className="font-heading text-[32px] font-semibold leading-10 text-navy">Payroll Management</h1>
      </section>
      <PayrollClient staffList={staffList} initialPayslips={payslips} />
    </div>
  );
}