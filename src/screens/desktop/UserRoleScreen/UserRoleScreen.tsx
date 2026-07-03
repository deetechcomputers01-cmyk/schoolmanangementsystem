/**
 * UserRoleScreen — desktop view for User Role Management and Security.
 * Covers: user management, role assignments, and blocked IP management.
 */
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/cookies";
import { listUsers } from "@/lib/services/user.service";
import { listBlockedIPs } from "@/lib/services/blocked-ip.service";
import { UserManagementClient } from "@/components/modules/admin/UserManagementClient";
import { BlockedIPClient } from "@/components/modules/admin/BlockedIPClient";
import styles from "./UserRoleScreen.module.css";

export const dynamic = "force-dynamic";

export async function UserRoleScreen() {
  const user = await getCurrentUser();
  if (!user || user.role !== "super_admin") redirect("/dashboard");
  const [users, blocked] = await Promise.all([listUsers(user), listBlockedIPs()]);
  return (
    <div className={styles.root}>
      <section className="mb-6">
        <p className="label-sm text-emerald">Security & Access</p>
        <h1 className="font-heading text-[32px] font-semibold leading-10 text-navy">Roles & Users</h1>
        <p className="text-muted">Manage staff accounts, role assignments, and blocked IP addresses.</p>
      </section>
      <div className="grid gap-8">
        <UserManagementClient users={users} currentUserId={user.id} />
        <BlockedIPClient initialList={blocked} />
      </div>
    </div>
  );
}