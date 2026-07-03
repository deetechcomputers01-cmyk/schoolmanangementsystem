"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useOfflineSync } from "@/hooks/useOfflineSync";

export function PaymentForm({ fees }: { fees: { id: string; description: string; student: { firstName: string; lastName: string } }[] }) {
  const { enqueue } = useOfflineSync();
  const router = useRouter();

  async function submit(formData: FormData) {
    await enqueue("/api/fees/payments", {
      feeRecordId: String(formData.get("feeRecordId")),
      amount: Number(formData.get("amount")),
      method: String(formData.get("method")),
      reference: String(formData.get("reference"))
    });
    router.refresh();
  }

  return (
    <form action={submit} className="grid gap-4 rounded-xl border border-line bg-white p-5 shadow-soft md:grid-cols-2">
      <Select name="feeRecordId" label="Invoice">{fees.map((fee) => <option key={fee.id} value={fee.id}>{fee.student.firstName} {fee.student.lastName} - {fee.description}</option>)}</Select>
      <Input name="amount" label="Amount paid" type="number" min="1" required />
      <Select name="method" label="Payment method"><option value="mobile_money">Mobile money</option><option value="cash">Cash</option><option value="bank_transfer">Bank transfer</option><option value="card">Card</option></Select>
      <Input name="reference" label="Reference" required />
      <div className="md:col-span-2"><Button>Record payment</Button></div>
    </form>
  );
}
