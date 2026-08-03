import { getCurrentUser } from "@backend/auth/cookies";
import { listBackups, getBackupStats } from "@backend/services/backup.service";
import { redirect } from "next/navigation";
import { BackupRestoreScreen } from "@/screens/desktop/BackupRestoreScreen/BackupRestoreScreen";

export const dynamic = "force-dynamic";
export const metadata = { title: "Backup & Restore – ScholarSphere" };

export default async function BackupRestorePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "super_admin") redirect("/dashboard");

  const [backups, stats] = await Promise.all([
    listBackups(),
    getBackupStats(),
  ]);

  return <BackupRestoreScreen initialBackups={backups as any} initialStats={stats as any} />;
}
