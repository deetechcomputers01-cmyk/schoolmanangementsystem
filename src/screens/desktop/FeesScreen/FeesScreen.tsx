/**
 * FeesScreen — desktop view for Fees & Payments.
 */
import Link from "next/link";
import { CreditCard, FileText } from "lucide-react";
import { FeeCard } from "@/components/modules/fees/FeeCard";
import { InvoiceTable } from "@/components/modules/fees/InvoiceTable";
import { Button } from "@/components/ui/Button";
import { listFees } from "@/lib/services/fee.service";
import { requireRole } from "@/lib/auth/page-guard";
import styles from "./FeesScreen.module.css";

export const dynamic = "force-dynamic";

export async function FeesScreen() {
  await requireRole("super_admin", "principal", "staff");
  const fees = await listFees();
  const total = fees.reduce((sum, fee) => sum + Number(fee.amountDue), 0);
  const paid = fees.reduce((sum, fee) => sum + fee.payments.reduce((inner, p) => inner + Number(p.amount), 0), 0);
  return (
    <div className={styles.root}>
      <section className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <p className="label-sm text-emerald">Finance Office</p>
          <h1 className="font-heading text-[32px] font-semibold leading-10 text-navy">Fees & Payments</h1>
          <p className="text-muted">Track GHS invoices, balances, and offline-ready payment collection.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/fees/invoices"><Button variant="secondary"><FileText size={18} /> Invoices</Button></Link>
          <Link href="/fees/receipt"><Button><CreditCard size={18} /> Record Payment</Button></Link>
        </div>
      </section>
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <FeeCard label="Expected Fees" amount={total} status="unpaid" />
        <FeeCard label="Collected" amount={paid} status="paid" />
        <FeeCard label="Outstanding" amount={total - paid} status={(total - paid) > 0 ? "partial" : "paid"} />
      </div>
      <InvoiceTable fees={fees} />
    </div>
  );
}