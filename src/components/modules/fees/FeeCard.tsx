import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { currency } from "@/lib/utils";

export function FeeCard({ label, amount, status }: { label: string; amount: number | string | { toString(): string }; status: string }) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div><p className="label-sm text-muted">{label}</p><p className="font-data mt-2 text-2xl font-semibold text-navy">{currency(amount)}</p></div>
        <Badge tone={status === "paid" ? "success" : status === "partial" ? "warning" : "danger"}>{status}</Badge>
      </div>
    </Card>
  );
}
