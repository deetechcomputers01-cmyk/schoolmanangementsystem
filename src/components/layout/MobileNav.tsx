import Link from "next/link";
import { BookMarked, BookOpen, CalendarDays, GraduationCap, Home, Receipt, Users } from "lucide-react";
import type { Role } from "@prisma/client";

type MobileNavItem = { href: string; label: string; icon: React.ElementType; roles: Role[] };

const mobileItems: MobileNavItem[] = [
  { href: "/dashboard",  label: "Home",     icon: Home,         roles: ["super_admin", "principal", "teacher", "staff"] },
  { href: "/students",   label: "Students", icon: GraduationCap, roles: ["super_admin", "principal", "teacher", "staff"] },
  { href: "/attendance", label: "Attend",   icon: CalendarDays,  roles: ["super_admin", "principal", "teacher"] },
  { href: "/gradebook",  label: "Grades",   icon: BookOpen,      roles: ["super_admin", "principal", "teacher"] },
  { href: "/fees",       label: "Fees",     icon: Receipt,       roles: ["super_admin", "principal", "staff"] },
  { href: "/timetable",  label: "Timetable", icon: Users,        roles: ["super_admin", "principal", "teacher", "student", "guardian"] },
  // student/guardian mobile
  { href: "/portal",     label: "Portal",   icon: BookMarked,    roles: ["student", "guardian"] },
  { href: "/dashboard",  label: "Home",     icon: Home,          roles: ["student", "guardian"] },
];

export function MobileNav({ role }: { role: Role | null }) {
  const visibleItems = role
    ? mobileItems.filter((item) => item.roles.includes(role)).slice(0, 5)
    : [];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white lg:hidden"
      style={{ gridTemplateColumns: `repeat(${visibleItems.length}, 1fr)` }}
    >
      <div className={`grid grid-cols-${visibleItems.length}`}>
        {visibleItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href + item.label}
              href={item.href}
              className="grid place-items-center gap-1 px-2 py-2 font-heading text-[11px] font-semibold text-muted hover:text-emerald"
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
