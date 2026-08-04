import { requireRole } from "@backend/auth/page-guard";
import { listHostels, listIncidents } from "@backend/services/hostel.service";
import { listStudents } from "@backend/services/student.service";
import { HostelContent } from "./HostelContent";
import { MobileHostelContent } from "@/screens/mobile/MobileHostelContent/MobileHostelContent";

export const dynamic = "force-dynamic";

export async function HostelScreen() {
  await requireRole("super_admin", "principal", "staff");

  const [hostels, incidents, allStudents] = await Promise.all([
    listHostels(),
    listIncidents(),
    listStudents(),
  ]);

  const allocatedStudentIds = new Set(
    hostels.flatMap((h) => h.rooms.flatMap((r) => r.allocations.map((a) => a.student.id)))
  );

  const hostelRows = hostels.map((h) => ({
    id: h.id,
    name: h.name,
    rooms: h.rooms.map((r) => ({
      id: r.id,
      name: r.name,
      capacity: r.capacity,
      occupants: r.allocations.map((a) => ({
        allocationId: a.id,
        studentId: a.student.id,
        name: `${a.student.firstName} ${a.student.lastName}`,
        admissionNo: a.student.admissionNo,
        className: a.student.class.name,
        bedNumber: a.bedNumber,
      })),
    })),
  }));
  const incidentRows = incidents.map((i) => ({
    id: i.id,
    description: i.description,
    studentName: i.student ? `${i.student.firstName} ${i.student.lastName}` : null,
    roomLabel: i.room ? `${i.room.hostel.name} · ${i.room.name}` : null,
    reportedByName: i.reportedBy.name,
    createdAt: i.createdAt.toISOString(),
  }));
  const unallocatedStudentRows = allStudents
    .filter((s) => !allocatedStudentIds.has(s.id))
    .map((s) => ({ id: s.id, name: `${s.firstName} ${s.lastName}`, admissionNo: s.admissionNo, className: s.class?.name ?? "—" }));

  return (
    <>
      <div className="mobileOnly">
        <MobileHostelContent hostels={hostelRows} incidents={incidentRows} unallocatedStudents={unallocatedStudentRows} />
      </div>
      <div className="desktopOnly">
        <HostelContent hostels={hostelRows} incidents={incidentRows} unallocatedStudents={unallocatedStudentRows} />
      </div>
    </>
  );
}
