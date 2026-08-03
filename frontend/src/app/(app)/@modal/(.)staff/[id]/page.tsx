import { RouteModal } from "@/components/desktop/ui/RouteModal/RouteModal";
import { StaffDetailScreen } from "@/screens/desktop/StaffDetailScreen/StaffDetailScreen";

export default function StaffDetailModalPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { tab?: string; edit?: string };
}) {
  return (
    <RouteModal>
      <StaffDetailScreen id={params.id} tab={searchParams.tab} edit={searchParams.edit} isModal />
    </RouteModal>
  );
}
