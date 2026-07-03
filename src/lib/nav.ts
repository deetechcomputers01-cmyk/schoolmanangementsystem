/**
 * nav.ts — one file, one purpose.
 * Defines all navigation items for the application.
 * Role-based filtering happens at the layout level; this file is the source of truth.
 */

import {
  LayoutDashboard, Users, UserCheck, BookOpen, Calendar,
  Wallet, BarChart2, Settings, Bell, LogIn, FileText,
  GraduationCap, Bus, Heart, Shield, Home, Package,
  UserCog, Wifi, ClipboardList, Megaphone, Receipt,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  group: "core" | "academic" | "finance" | "admin" | "portals";
  roles: Array<"admin" | "teacher" | "accountant" | "student" | "parent">;
}

export const ALL_NAV_ITEMS: NavItem[] = [
  // core
  { href: "/dashboard",         label: "Dashboard",      icon: LayoutDashboard, group: "core",     roles: ["admin","teacher","accountant","student","parent"] },
  { href: "/notifications",     label: "Notifications",  icon: Bell,            group: "core",     roles: ["admin","teacher","accountant","student","parent"] },

  // academic
  { href: "/students",            label: "Students",          icon: Users,           group: "academic", roles: ["admin","teacher"] },
  { href: "/staff",               label: "Staff",             icon: UserCheck,       group: "academic", roles: ["admin"] },
  { href: "/admissions",          label: "Admissions",        icon: LogIn,           group: "academic", roles: ["admin"] },
  { href: "/attendance",          label: "Attendance",        icon: ClipboardList,   group: "academic", roles: ["admin","teacher"] },
  { href: "/gradebook",           label: "Gradebook",         icon: BookOpen,        group: "academic", roles: ["admin","teacher"] },
  { href: "/exams",               label: "Examinations",      icon: ClipboardList,   group: "academic", roles: ["admin","teacher"] },
  { href: "/report-cards",        label: "Report Cards",      icon: FileText,        group: "academic", roles: ["admin","teacher","student"] },
  { href: "/timetable",           label: "Timetable",         icon: Calendar,        group: "academic", roles: ["admin","teacher","student"] },
  { href: "/academic-calendar",   label: "Academic Calendar", icon: Calendar,        group: "academic", roles: ["admin","teacher"] },
  { href: "/library",             label: "Library",           icon: FileText,        group: "academic", roles: ["admin","teacher","student"] },
  { href: "/announcements",       label: "Announcements",     icon: Megaphone,       group: "academic", roles: ["admin","teacher","student","parent"] },
  { href: "/discipline",          label: "Discipline",        icon: Shield,          group: "academic", roles: ["admin","teacher"] },
  { href: "/health",              label: "Health",            icon: Heart,           group: "academic", roles: ["admin"] },
  { href: "/transport",           label: "Transport",         icon: Bus,             group: "academic", roles: ["admin"] },
  { href: "/hostel",              label: "Hostel",            icon: Home,            group: "academic", roles: ["admin"] },

  // finance
  { href: "/fees",                label: "Fees",              icon: Wallet,          group: "finance",  roles: ["admin","accountant"] },
  { href: "/payroll",             label: "Payroll",           icon: Receipt,         group: "finance",  roles: ["admin"] },
  { href: "/reports",             label: "Reports",           icon: BarChart2,       group: "finance",  roles: ["admin","accountant"] },
  { href: "/assets",              label: "Assets",            icon: Package,         group: "admin",    roles: ["admin"] },

  // admin
  { href: "/user-role",           label: "Roles & Users",     icon: UserCog,         group: "admin",    roles: ["admin"] },
  { href: "/audit-logs",          label: "Audit Logs",        icon: FileText,        group: "admin",    roles: ["admin"] },
  { href: "/offline-sync",        label: "Offline Sync",      icon: Wifi,            group: "admin",    roles: ["admin"] },
  { href: "/settings",            label: "Settings",          icon: Settings,        group: "admin",    roles: ["admin","teacher","accountant","student","parent"] },

  // portals
  { href: "/teacher-portal",   label: "My Classes",     icon: GraduationCap,   group: "portals",  roles: ["teacher"] },
  { href: "/student-portal",   label: "My Portal",      icon: GraduationCap,   group: "portals",  roles: ["student"] },
  { href: "/parent-portal",    label: "Parent Portal",  icon: Users,           group: "portals",  roles: ["parent"] },
  { href: "/accountant-portal",label: "Finance Hub",    icon: Wallet,          group: "portals",  roles: ["accountant"] },
];

export function getNavForRole(role: NavItem["roles"][0]) {
  return ALL_NAV_ITEMS.filter((item) => item.roles.includes(role));
}
