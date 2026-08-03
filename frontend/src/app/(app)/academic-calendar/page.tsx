import { AcademicCalendarScreen } from "@/screens/desktop/AcademicCalendarScreen/AcademicCalendarScreen";

export default function Page({ searchParams }: { searchParams: { tab?: string } }) {
  return <AcademicCalendarScreen initialTab={searchParams.tab === "years" ? "years" : "calendar"} />;
}
