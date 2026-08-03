import { FeesScreen } from "@/screens/desktop/FeesScreen/FeesScreen";

export default function Page({
  searchParams,
}: {
  searchParams?: { studentId?: string; feeRecordId?: string; recordPayment?: string };
}) {
  return (
    <FeesScreen
      studentId={searchParams?.studentId}
      feeRecordId={searchParams?.feeRecordId}
      recordPayment={searchParams?.recordPayment}
    />
  );
}
