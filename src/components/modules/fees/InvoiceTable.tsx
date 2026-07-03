import { Table } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { currency } from "@backend/utils";

type Fee = { id: string; term: string; description: string; amountDue: string | number | { toString(): string }; status: string; student: { firstName: string; lastName: string; class: { name: string } } };

export function InvoiceTable({ fees }: { fees: Fee[] }) {
  return (
    <Table>
      <thead className="label-sm bg-slate-100 text-left text-muted">
        <tr><th className="px-4 py-3">Student</th><th className="px-4 py-3">Class</th><th className="px-4 py-3">Fee</th><th className="px-4 py-3">Amount</th><th className="px-4 py-3">Status</th></tr>
      </thead>
      <tbody className="divide-y divide-line">
        {fees.map((fee) => (
          <tr key={fee.id}><td className="px-4 py-3 font-medium">{fee.student.firstName} {fee.student.lastName}</td><td className="px-4 py-3">{fee.student.class.name}</td><td className="px-4 py-3">{fee.description}</td><td className="px-4 py-3">{currency(fee.amountDue)}</td><td className="px-4 py-3"><Badge tone={fee.status === "paid" ? "success" : "warning"}>{fee.status}</Badge></td></tr>
        ))}
      </tbody>
    </Table>
  );
}
