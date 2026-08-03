import { RouteModal } from "@/components/desktop/ui/RouteModal/RouteModal";
import { StudentDetailScreen } from "@/screens/desktop/StudentDetailScreen/StudentDetailScreen";

export default function StudentDetailModalPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { edit?: string };
}) {
  return (
    <RouteModal>
      <StudentDetailScreen id={params.id} edit={searchParams.edit} isModal />
    </RouteModal>
  );
}
