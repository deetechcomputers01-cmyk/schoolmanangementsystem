import { StaffDetailScreen } from "@/screens/desktop/StaffDetailScreen/StaffDetailScreen";

export default function StaffDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { tab?: string; edit?: string };
}) {
  return <StaffDetailScreen id={params.id} tab={searchParams.tab} edit={searchParams.edit} />;
}
