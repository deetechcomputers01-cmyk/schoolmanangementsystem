import { ExamsScreen } from "@/screens/desktop/ExamsScreen/ExamsScreen";

export default function Page({ params }: { params: { id: string } }) {
  return <ExamsScreen initialExamId={params.id} />;
}
