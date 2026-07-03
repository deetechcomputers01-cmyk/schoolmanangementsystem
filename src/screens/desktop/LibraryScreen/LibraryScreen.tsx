/**
 * LibraryScreen — desktop view for the Library module.
 */
import { getCurrentUser } from "@/lib/auth/cookies";
import { listBooks, listCheckouts } from "@/lib/services/library.service";
import { LibraryClient } from "@/components/modules/library/LibraryClient";
import { requireRole } from "@/lib/auth/page-guard";
import { prisma } from "@/lib/prisma";
import styles from "./LibraryScreen.module.css";

export const dynamic = "force-dynamic";

export async function LibraryScreen() {
  await requireRole("super_admin", "principal", "teacher", "staff", "student");
  const [user, books, checkouts, students] = await Promise.all([
    getCurrentUser(),
    listBooks(),
    listCheckouts(),
    prisma.student.findMany({
      orderBy: [{ lastName: "asc" }],
      select: { id: true, firstName: true, lastName: true, class: { select: { name: true } } },
    }),
  ]);
  const canManage = user?.role === "super_admin" || user?.role === "principal" || user?.role === "staff";
  return (
    <div className={styles.root}>
      <LibraryClient initialBooks={books} initialCheckouts={checkouts} students={students} canManage={canManage} />
    </div>
  );
}