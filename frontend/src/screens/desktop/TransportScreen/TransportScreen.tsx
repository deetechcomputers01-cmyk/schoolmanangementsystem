import { requireRole } from "@backend/auth/page-guard";
import { prisma } from "@backend/prisma";
import { TransportContent } from "./TransportContent";
import { MobileTransportContent } from "@/screens/mobile/MobileTransportContent/MobileTransportContent";

export const dynamic = "force-dynamic";

export async function TransportScreen() {
  await requireRole("super_admin", "principal", "staff");

  const [vehicles, routes, unassignedStudents, drivers] = await Promise.all([
    prisma.vehicle.findMany({
      include: { driver: { select: { id: true, firstName: true, lastName: true, roleTitle: true, phone: true } } },
      orderBy: { regNo: "asc" },
    }),
    prisma.transportRoute.findMany({
      include: {
        vehicle: { select: { id: true, regNo: true, make: true, type: true, capacity: true } },
        students: {
          include: {
            student: { select: { id: true, firstName: true, lastName: true, class: { select: { name: true } } } },
          },
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.student.findMany({
      where: { transport: { none: {} } },
      select: { id: true, firstName: true, lastName: true, admissionNo: true, class: { select: { name: true } } },
      orderBy: [{ firstName: "asc" }],
    }),
    prisma.staff.findMany({
      where: { staffCategory: "driver" },
      select: { id: true, firstName: true, lastName: true },
      orderBy: [{ firstName: "asc" }],
    }),
  ]);

  const vehicleRows = vehicles.map((v) => ({
    id:         v.id,
    regNo:      v.regNo,
    make:       v.make,
    capacity:   v.capacity,
    type:       v.type,
    driverName: v.driver ? `${v.driver.firstName} ${v.driver.lastName}` : null,
    driverId:   v.driverId ?? null,
    driverPhone: v.driver?.phone ?? null,
    latitude:   v.latitude,
    longitude:  v.longitude,
    speed:      v.speed,
    locationUpdatedAt: v.locationUpdatedAt ? v.locationUpdatedAt.toISOString() : null,
  }));

  const routeRows = routes.map((r) => ({
    id:             r.id,
    name:           r.name,
    vehicleId:      r.vehicleId ?? null,
    vehicleRegNo:   r.vehicle?.regNo ?? null,
    vehicleMake:    r.vehicle?.make ?? null,
    vehicleType:    r.vehicle?.type ?? null,
    vehicleCapacity: r.vehicle?.capacity ?? null,
    stops:          r.stops,
    morningPickup:  r.morningPickup,
    afternoonDrop:  r.afternoonDrop,
    studentCount:   r.students.length,
    students: r.students.map((st) => ({
      id:        st.student.id,
      name:      `${st.student.firstName} ${st.student.lastName}`,
      className: st.student.class.name,
    })),
  }));

  const stats = {
    totalVehicles: vehicles.length,
    totalRoutes:   routes.length,
    totalStudents: routes.reduce((sum, r) => sum + r.students.length, 0),
    activeDrivers: vehicles.filter((v) => v.driverId).length,
  };

  const unassignedStudentRows = unassignedStudents.map((s) => ({ id: s.id, name: `${s.firstName} ${s.lastName}`, admissionNo: s.admissionNo, className: s.class.name }));
  const driverRows = drivers.map((d) => ({ id: d.id, name: `${d.firstName} ${d.lastName}` }));

  return (
    <>
      <div className="mobileOnly">
        <MobileTransportContent
          vehicles={vehicleRows}
          routes={routeRows}
          stats={stats}
          unassignedStudents={unassignedStudentRows}
          drivers={driverRows}
        />
      </div>
      <div className="desktopOnly">
        <TransportContent
          vehicles={vehicleRows}
          routes={routeRows}
          stats={stats}
          unassignedStudents={unassignedStudentRows}
          drivers={driverRows}
        />
      </div>
    </>
  );
}
