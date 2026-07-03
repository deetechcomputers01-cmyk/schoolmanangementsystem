/**
 * PaymentReceiptScreen — desktop view for recording fee payments.
 */
import { PaymentForm } from "@/components/modules/fees/PaymentForm";
import { listFees } from "@/lib/services/fee.service";
import styles from "./PaymentReceiptScreen.module.css";

export const dynamic = "force-dynamic";

export async function PaymentReceiptScreen() {
  const fees = await listFees();
  return (
    <div className={styles.root}>
      <section className="mb-6">
        <p className="label-sm text-emerald">Finance Office</p>
        <h1 className="font-heading text-[32px] font-semibold leading-10 text-navy">Record Payment</h1>
      </section>
      <PaymentForm fees={fees} />
    </div>
  );
}