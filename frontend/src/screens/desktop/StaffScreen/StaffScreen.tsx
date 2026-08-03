import { redirect } from "next/navigation";
import { getCurrentUser } from "@backend/auth/cookies";
import { listStaff } from "@backend/services/staff.service";
import { StaffContent, type StaffContentProps } from "./StaffContent";
import { MobileStaffContent } from "@/screens/mobile/MobileStaffContent/MobileStaffContent";

export const dynamic = "force-dynamic";

export async function StaffScreen() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!["super_admin", "principal", "staff"].includes(user.role)) redirect("/dashboard");

  const staff = await listStaff();

  const staffListWithPhoto = staff.map(s => ({
    id: s.id,
    staffNo: s.staffNo,
    firstName: s.firstName,
    lastName: s.lastName,
    roleTitle: s.roleTitle,
    staffCategory: s.staffCategory,
    isTeaching: s.isTeaching,
    phone: s.phone,
    photoUrl: s.photoUrl ?? null,
    subjects: s.subjects.map(sub => sub.name),
  }));

  const props: StaffContentProps = {
    staffList: staffListWithPhoto,
    totalStaff: staff.length,
    teachers: staff.filter(s => s.isTeaching).length,
    supportStaff: staff.filter(s => !s.isTeaching).length,
    canManage: ["super_admin", "principal"].includes(user.role),
  };

  return (
    <>
      <div className="mobileOnly">
        <MobileStaffContent
          staffList={staffListWithPhoto}
          totalStaff={props.totalStaff}
          teachers={props.teachers}
          supportStaff={props.supportStaff}
          canManage={props.canManage}
        />
      </div>
      <div className="desktopOnly">
        <StaffContent {...props} />
      </div>
    </>
  );
}
