import { redirect } from "next/navigation";

export default function Page() {
  redirect("/academic-calendar?tab=years");
}
