import { Bell, CheckCircle2, Search } from "lucide-react";
import type { SessionUser } from "@/types/auth";
import { Badge } from "@/components/ui/Badge";

export function Topbar({ user }: { user: SessionUser | null }) {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-shell/95 px-4 py-3 backdrop-blur lg:px-8">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4">
        <div className="hidden min-w-0 flex-1 items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-sm text-muted md:flex">
          <Search size={16} />
          <span>Search students, invoices, classes</span>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-full border border-emerald/20 bg-emerald/10 px-3 py-1.5 text-xs font-semibold text-emerald sm:flex">
            <CheckCircle2 size={14} />
            Synced
          </div>
          <button className="focus-ring grid h-10 w-10 place-items-center rounded-lg border border-line bg-white text-muted" aria-label="Notifications">
            <Bell size={18} />
          </button>
          <div className="text-right">
            <p className="font-heading text-sm font-semibold text-navy">{user?.name ?? "School user"}</p>
            <Badge roleName={user?.role ?? "parent"}>{user?.role ?? "guest"}</Badge>
          </div>
        </div>
      </div>
    </header>
  );
}
