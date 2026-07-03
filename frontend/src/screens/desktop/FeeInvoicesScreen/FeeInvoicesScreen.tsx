/**
 * FeeInvoicesScreen — desktop view for Fee Invoices management.
 */
import { FeeRecordForm } from "@/components/modules/fees/FeeRecordForm";
import { InvoiceTable } from "@/components/modules/fees/InvoiceTable";
import { listFees } from "@backend/services/fee.service";
import { listStudents } from "@backend/services/student.service";
import styles from "./FeeInvoicesScreen.module.css";

export const dynamic = "force-dynamic";

export async function FeeInvoicesScreen() {
  const [fees, students] = await Promise.all([listFees(), listStudents()]);
  return (
    <div className={styles.root}>
      <section className="mb-6">
        <p className="label-sm text-emerald">Finance Office</p>
        <h1 className="font-heading text-[32px] font-semibold leading-10 text-navy">Fee Invoices</h1>
      </section>
      <div className="grid gap-6">
        <FeeRecordForm
          students={students.map(({ id, firstName, lastName, class: cls }) => ({
            id, firstName, lastName, class: { name: cls.name },
          }))}
        />
        <InvoiceTable fees={fees} />
      </div>
    </div>
  );
}