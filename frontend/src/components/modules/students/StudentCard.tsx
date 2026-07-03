import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

type Props = {
  student: {
    firstName: string;
    lastName: string;
    photoUrl?: string | null;
    admissionNo: string;
    address: string;
    class: { name: string };
    guardians: { name: string; phone: string; relation: string }[];
  };
};

export function StudentCard({ student }: Props) {
  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-4">
            <span
              className="grid h-14 w-14 place-items-center overflow-hidden rounded-xl bg-navy bg-cover bg-center text-sm font-bold text-white"
              style={student.photoUrl ? { backgroundImage: `url(${student.photoUrl})` } : undefined}
            >
              {!student.photoUrl && `${student.firstName[0]}${student.lastName[0]}`}
            </span>
            <div>
              <h2 className="font-heading text-xl font-semibold text-navy">{student.firstName} {student.lastName}</h2>
              <p className="font-data mt-1 text-sm text-muted">{student.admissionNo}</p>
            </div>
          </div>
        </div>
        <Badge tone="success">{student.class.name}</Badge>
      </div>
      <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
        <div><dt className="label-sm text-muted">Address</dt><dd className="font-medium text-navy">{student.address}</dd></div>
        <div><dt className="label-sm text-muted">Guardian</dt><dd className="font-medium text-navy">{student.guardians[0]?.name ?? "Not assigned"}</dd></div>
        <div><dt className="label-sm text-muted">Guardian phone</dt><dd className="font-medium text-navy">{student.guardians[0]?.phone ?? "-"}</dd></div>
        <div><dt className="label-sm text-muted">Relation</dt><dd className="font-medium text-navy">{student.guardians[0]?.relation ?? "-"}</dd></div>
      </dl>
    </Card>
  );
}
