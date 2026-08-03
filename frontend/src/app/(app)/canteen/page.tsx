import { CanteenScreen } from "@/screens/desktop/CanteenScreen/CanteenScreen";

export default function Page({ searchParams }: { searchParams: { week?: string } }) {
  return <CanteenScreen weekParam={searchParams.week} />;
}
