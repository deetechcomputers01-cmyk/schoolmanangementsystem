import { Badge } from "@/components/ui/Badge";

export function PeriodBlock({ subject, className, time, room }: { subject: string; className: string; time: string; room: string }) {
  return (
    <div className="rounded-lg border border-line bg-white p-3 shadow-soft">
      <div className="flex items-start justify-between gap-2">
        <p className="font-heading font-semibold text-navy">{subject}</p>
        <Badge>{room}</Badge>
      </div>
      <p className="mt-1 text-sm text-muted">{className}</p>
      <p className="font-data mt-2 text-xs font-semibold text-emerald">{time}</p>
    </div>
  );
}
