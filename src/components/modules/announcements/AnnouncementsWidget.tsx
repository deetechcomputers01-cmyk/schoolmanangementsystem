import Link from "next/link";
import { listAnnouncements } from "@/lib/services/announcement.service";
import { Bell, Pin } from "lucide-react";

export async function AnnouncementsWidget({ role }: { role: string }) {
  const list = await listAnnouncements(role);
  const items = list.slice(0, 3);

  if (items.length === 0) return null;

  return (
    <section className="mt-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-heading text-base font-semibold text-navy">
          <Bell size={16} /> Announcements
        </h2>
        <Link href="/announcements" className="text-xs font-semibold text-emerald hover:underline">
          View All →
        </Link>
      </div>
      <div className="grid gap-3">
        {items.map((ann) => (
          <div key={ann.id}
            className={`rounded-2xl border p-4 ${ann.isPinned ? "border-amber/30 bg-amber/5" : "border-line bg-white"}`}>
            <div className="flex items-start gap-2">
              {ann.isPinned && <Pin size={13} className="mt-0.5 shrink-0 text-amber" />}
              <div>
                <p className="font-heading text-sm font-semibold text-navy">{ann.title}</p>
                <p className="mt-1 line-clamp-2 text-xs text-muted">{ann.body}</p>
                <p className="mt-1.5 text-[11px] text-muted/70">
                  {new Date(ann.publishedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
