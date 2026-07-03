import Link from "next/link";
import {
  Activity, Bell, BookOpen, BookMarked, CalendarDays, CalendarRange,
  ClipboardList, FileText, GraduationCap, Heart, LayoutDashboard,
  Library, Receipt, ShieldCheck, ShieldAlert, ScrollText, Settings,
  UserCog, UserPlus, UserRoundCog, Users, Wallet, Wifi
} from "lucide-react";
import type { Role } from "@prisma/client";

type NavItem = { href: string; label: string; icon: React.ElementType };

const allItems: Array<NavItem & { roles: Role[] }> = [
  { href: "/dashboard",  label: "Dashboard",       icon: LayoutDashboard, roles: ["super_admin", "principal", "teacher", "staff", "student", "guardian"] },
  { href: "/students",   label: "Students",         icon: GraduationCap,   roles: ["super_admin", "principal", "teacher", "staff"] },
  { href: "/staff",      label: "Staff",            icon: UserRoundCog,    roles: ["super_admin", "principal"] },
  { href: "/attendance", label: "Attendance",       icon: CalendarDays,    roles: ["super_admin", "principal", "teacher"] },
  { href: "/gradebook",  label: "Gradebook",        icon: BookOpen,        roles: ["super_admin", "principal", "teacher"] },
  { href: "/fees",       label: "Fees",             icon: Receipt,         roles: ["super_admin", "principal", "staff"] },
  { href: "/timetable",          label: "Timetable",          icon: Users,          roles: ["super_admin", "principal", "teacher", "student", "guardian"] },
  { href: "/exams",              label: "Examinations",       icon: ClipboardList,  roles: ["super_admin", "principal", "teacher"] },
  { href: "/report-cards",      label: "Report Cards",       icon: FileText,       roles: ["super_admin", "principal", "teacher", "staff"] },
  { href: "/academic-calendar", label: "Academic Calendar",  icon: CalendarRange,  roles: ["super_admin", "principal", "teacher", "staff"] },
  { href: "/announcements",     label: "Announcements",      icon: Bell,           roles: ["super_admin", "principal", "teacher", "staff", "student", "guardian"] },
  { href: "/admissions",        label: "Admissions",         icon: UserPlus,       roles: ["super_admin", "principal", "staff"] },
  { href: "/payroll",           label: "Payroll",            icon: Wallet,         roles: ["super_admin", "principal"] },
  { href: "/disciplinary",      label: "Disciplinary",       icon: Activity,       roles: ["super_admin", "principal", "teacher"] },
  { href: "/health",            label: "Health Records",     icon: Heart,          roles: ["super_admin", "principal", "staff"] },
  { href: "/library",           label: "Library",            icon: Library,        roles: ["super_admin", "principal", "teacher", "staff", "student"] },
  { href: "/reports",           label: "Reports",            icon: ScrollText,     roles: ["super_admin", "principal", "staff"] },
  // Student & Guardian portal
  { href: "/portal",     label: "My Portal",        icon: BookMarked,      roles: ["student", "guardian"] },
  // Super admin only
  { href: "/admin/users",       label: "User Management", icon: UserCog,    roles: ["super_admin"] },
  { href: "/admin/blocked-ips", label: "Blocked IPs",     icon: ShieldAlert, roles: ["super_admin"] },
  { href: "/admin/audit",       label: "Audit Trail",     icon: ScrollText,  roles: ["super_admin"] },
  { href: "/admin/settings",    label: "Settings",        icon: Settings,    roles: ["super_admin"] },
];

export function Sidebar({ role }: { role: Role | null }) {
  const items = role ? allItems.filter((item) => item.roles.includes(role)) : [];

  return (
    <aside className="hidden min-h-screen w-[280px] bg-navy px-5 py-6 text-white lg:flex lg:flex-col">
      <div className="mb-8 flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-white/10 ring-1 ring-white/15">
          <ShieldCheck size={22} className="text-emerald" />
        </div>
        <div>
          <p className="label-sm text-emerald">ScholarSphere Pro</p>
          <h1 className="font-heading text-xl font-bold">School MS</h1>
        </div>
      </div>

      <nav className="grid gap-1.5">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-2xl border border-white/10 bg-white/[0.06] p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald shadow-emerald" />
          Online
        </div>
        <p className="mt-2 flex items-center gap-2 text-xs text-slate-300">
          <Wifi size={14} />
          Last synced: just now
        </p>
      </div>
    </aside>
  );
}
