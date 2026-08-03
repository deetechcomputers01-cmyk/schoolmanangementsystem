import { StudentDetailScreen } from "@/screens/desktop/StudentDetailScreen/StudentDetailScreen";

export default function StudentDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { edit?: string };
}) {
  return <StudentDetailScreen id={params.id} edit={searchParams.edit} />;
}
