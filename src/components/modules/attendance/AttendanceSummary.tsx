import { Card } from "@/components/ui/Card";

export function AttendanceSummary({ present, absent, late }: { present: number; absent: number; late: number }) {
  const stats = [
    ["Present", present, "text-emerald-700"],
    ["Absent", absent, "text-rose"],
    ["Late", late, "text-amber-700"]
  ] as const;
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {stats.map(([label, value, color]) => (
        <Card key={label}>
          <p className="label-sm text-muted">{label}</p>
          <p className={`font-data mt-2 text-3xl font-semibold ${color}`}>{value}</p>
        </Card>
      ))}
    </div>
  );
}
