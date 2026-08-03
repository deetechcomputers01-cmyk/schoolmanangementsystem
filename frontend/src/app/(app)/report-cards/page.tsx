import { redirect } from "next/navigation";
import { getCurrentUser } from "@backend/auth/cookies";
import { prisma } from "@backend/prisma";
import { ReportCardsScreen } from "@/screens/desktop/ReportCardsScreen/ReportCardsScreen";

export const dynamic = "force-dynamic";

export default async function Page() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  if (user.role === "student") {
    const student = await prisma.student.findFirst({ where: { userId: user.id }, select: { id: true } });
    if (student) redirect(`/report-cards/${student.id}`);
    redirect("/dashboard");
  }

  return <ReportCardsScreen />;
}
