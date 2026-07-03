/**
 * AuditLogsScreen — desktop view for the System Audit Trail.
 */
import { redirect } from "next/navigation";
import { getCurrentUser } from "@backend/auth/cookies";
import { prisma } from "@backend/prisma";
import { Badge } from "@/components/ui/Badge";
import { ScrollText } from "lucide-react";
import styles from "./AuditLogsScreen.module.css";

export const dynamic = "force-dynamic";

export async function AuditLogsScreen() {
  const user = await getCurrentUser();
  if (!user || user.role !== "super_admin") redirect("/dashboard");
  const logs = await prisma.auditLog.findMany({
    include: { user: { select: { name: true, role: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return (
    <div className={styles.root}>
      <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-soft">
        <div className="flex items-center gap-3 border-b border-line px-6 py-4">
          <ScrollText size={18} className="text-navy" />
          <h2 className="font-heading text-lg font-semibold text-navy">System Audit Log</h2>
          <span className="ml-auto label-sm text-muted">Last 100 entries</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-muted">
              <tr>
                <th className="px-6 py-3">Timestamp</th><th className="px-6 py-3">User</th>
                <th className="px-6 py-3">Role</th><th className="px-6 py-3">Action</th>
                <th className="px-6 py-3">Entity</th><th className="px-6 py-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {logs.map((log) => (
                <tr key={log.id} className="transition hover:bg-slate-50">
                  <td className="whitespace-nowrap px-6 py-3 font-data text-xs text-muted">
                    {new Date(log.createdAt).toLocaleString("en-GB")}
                  </td>
                  <td className="px-6 py-3 font-semibold text-navy">
                    {log.user?.name ?? <span className="text-muted">System</span>}
                  </td>
                  <td className="px-6 py-3">
                    {log.user?.role
                      ? <Badge tone="neutral">{log.user.role.replace("_", " ")}</Badge>
                      : <span className="text-muted">—</span>}
                  </td>
                  <td className="px-6 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${
                      log.action.startsWith("delete") ? "bg-rose-50 text-rose-600"
                      : log.action.startsWith("create") ? "bg-emerald/10 text-emerald"
                      : "bg-amber/10 text-amber"
                    }`}>{log.action}</span>
                  </td>
                  <td className="px-6 py-3 text-muted">{log.entity}</td>
                  <td className="max-w-xs truncate px-6 py-3 text-xs text-muted">
                    {log.metadata ? JSON.stringify(log.metadata) : log.entityId}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-muted">No audit entries yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}