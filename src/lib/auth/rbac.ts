import type { Role } from "@prisma/client";
import type { SessionUser } from "@/types/auth";

const permissions: Record<Role, string[]> = {
  super_admin: ["*"],

  principal: [
    "students:read", "students:write",
    "staff:read", "staff:write",
    "attendance:read", "attendance:write",
    "grades:read", "grades:write",
    "fees:read", "fees:write",
    "payments:read", "payments:write",
    "timetable:read", "timetable:write",
    "reports:read",
    "announcements:read", "announcements:write"
  ],

  teacher: [
    "students:read",
    "staff:read",
    "attendance:read", "attendance:write",
    "grades:read", "grades:write",
    "timetable:read"
  ],

  staff: [
    "students:read",
    "attendance:read",
    "fees:read", "fees:write",
    "payments:read", "payments:write",
    "reports:read"
  ],

  student: [
    "students:read:own",
    "attendance:read:own",
    "grades:read:own",
    "fees:read:own",
    "timetable:read",
    "announcements:read"
  ],

  guardian: [
    "students:read:children",
    "attendance:read:children",
    "grades:read:children",
    "fees:read:children",
    "timetable:read",
    "announcements:read"
  ]
};

// Routes each role is allowed to visit (checked in middleware)
export const roleRouteMap: Record<Role, string[]> = {
  super_admin: ["/"],           // super_admin bypasses route check
  principal:   ["/dashboard", "/students", "/staff", "/attendance", "/gradebook", "/fees", "/timetable", "/academic-calendar", "/exams", "/report-cards", "/announcements", "/admissions", "/payroll", "/disciplinary", "/health", "/library", "/reports"],
  teacher:     ["/dashboard", "/students", "/attendance", "/gradebook", "/timetable", "/academic-calendar", "/exams", "/report-cards", "/announcements", "/disciplinary", "/library"],
  staff:       ["/dashboard", "/students", "/fees", "/reports", "/academic-calendar", "/report-cards", "/announcements", "/admissions", "/health", "/library"],
  student:     ["/dashboard", "/portal", "/report-cards", "/timetable", "/announcements", "/library"],
  guardian:    ["/dashboard", "/portal", "/report-cards", "/timetable", "/announcements"]
};

export function can(user: SessionUser | null, permission: string): boolean {
  if (!user) return false;
  const allowed = permissions[user.role] ?? [];
  return allowed.includes("*") || allowed.includes(permission);
}

export function assertCan(user: SessionUser | null, permission: string): void {
  if (!can(user, permission)) throw new Error("Forbidden");
}

export function isSuperAdmin(user: SessionUser | null): boolean {
  return user?.role === "super_admin";
}

export function canAccessRoute(user: SessionUser, pathname: string): boolean {
  if (user.role === "super_admin") return true;
  const allowed = roleRouteMap[user.role] ?? [];
  return allowed.some((route) => pathname === route || pathname.startsWith(route + "/"));
}
