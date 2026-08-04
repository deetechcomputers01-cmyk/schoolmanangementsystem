import { redirect } from "next/navigation";
import { getCurrentUser } from "@backend/auth/cookies";
import { getTransportPortalData } from "@backend/services/portal.service";
import { TransportPortalContent } from "./TransportPortalContent";
import { MobileTransportPortalContent } from "@/screens/mobile/MobileTransportPortalContent/MobileTransportPortalContent";

export const dynamic = "force-dynamic";

export async function TransportPortalScreen() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const data = await getTransportPortalData(user.id).catch(() => null);
  if (!data) {
    return (
      <div className="p-8 text-center text-gray-400">
        No transport data found. Please contact your administrator.
      </div>
    );
  }

  const { staffRecord, vehicles, totalStudents } = data;

  const vehicleRows = vehicles.map((v) => ({
    id: v.id,
    regNo: v.regNo,
    make: v.make,
    type: v.type,
    capacity: v.capacity,
    routes: v.routes.map((r) => ({
      id: r.id,
      name: r.name,
      morningPickup: r.morningPickup,
      afternoonDrop: r.afternoonDrop,
      stops: r.stops,
      students: r.students.map((st) => ({
        firstName: st.student.firstName,
        lastName: st.student.lastName,
        admissionNo: st.student.admissionNo,
        className: st.student.class.name,
      })),
    })),
  }));

  return (
    <>
      <div className="mobileOnly">
        <MobileTransportPortalContent staffRecord={staffRecord} vehicles={vehicleRows} totalStudents={totalStudents} />
      </div>
      <div className="desktopOnly">
        <TransportPortalContent staffRecord={staffRecord} vehicles={vehicleRows} totalStudents={totalStudents} />
      </div>
    </>
  );
}
