import { RouteModal } from "@/components/desktop/ui/RouteModal/RouteModal";
import { ReportCardModalScreen } from "../../../report-cards/[studentId]/ReportCardModalScreen";

export default function ReportCardModalPage({ params }: { params: { studentId: string } }) {
  return (
    <RouteModal>
      <ReportCardModalScreen studentId={params.studentId} />
    </RouteModal>
  );
}
