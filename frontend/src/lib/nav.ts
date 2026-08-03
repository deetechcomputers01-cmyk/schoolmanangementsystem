import {
  Activity, LayoutDashboard, Bell, Users, UserCheck, LogIn, ClipboardList,
  BookOpen, FileText, Calendar, Megaphone, Shield, Heart, Bus,
  Home, Wallet, Receipt, BarChart2, Package, UserCog, Wifi,
  Settings, GraduationCap, Utensils, Lock, Truck, ShoppingCart, Award,
  GitBranch, MessageSquare, Upload, Database, HardDrive, FolderOpen, LifeBuoy, Send,
  MoreHorizontal,
  type LucideIcon,
} from "lucide-react";

export type NavIconKey =
  | "LayoutDashboard" | "Bell" | "Users" | "UserCheck" | "LogIn"
  | "ClipboardList" | "BookOpen" | "FileText" | "Calendar" | "Megaphone"
  | "Shield" | "Heart" | "Bus" | "Home" | "Wallet" | "Receipt"
  | "BarChart2" | "Package" | "UserCog" | "Wifi" | "Settings" | "GraduationCap"
  | "Utensils" | "Lock" | "Truck" | "Activity" | "MessageSquare"
  | "ShoppingCart" | "Award" | "GitBranch" | "Upload" | "Database"
  | "HardDrive" | "FolderOpen" | "LifeBuoy" | "Send" | "MoreHorizontal";

export interface NavItem {
  href:  string;
  label: string;
  icon:  NavIconKey;
  /** Sidebar section key — "main" renders with no label; all others render as uppercase headings */
  group: "main" | "academics" | "campus" | "finance" | "management" | "communication" | "system" | "portals";
  roles: Array<"admin" | "teacher" | "accountant" | "student" | "parent" | "driver" | "caterer" | "nurse" | "security">;
}

export const ALL_NAV_ITEMS: NavItem[] = [
  // ── main (no section heading) ─────────────────────────────────────────────
  { href: "/dashboard",     label: "Dashboard",     icon: "LayoutDashboard", group: "main",     roles: ["admin","teacher","accountant","parent","driver","caterer","nurse","security"] },
  { href: "/dashboard",     label: "My Dashboard",  icon: "LayoutDashboard", group: "main",     roles: ["student"] },
  { href: "/notifications", label: "Notifications", icon: "Bell",            group: "main",     roles: ["admin","teacher","accountant","student","parent","driver","caterer","nurse","security"] },
  { href: "/announcements", label: "Announcements", icon: "Megaphone",       group: "main",     roles: ["admin","teacher","student","parent","accountant","driver","caterer","nurse","security"] },

  // ── academics ─────────────────────────────────────────────────────────────
  { href: "/students",          label: "Students",              icon: "Users",         group: "academics", roles: ["admin","teacher"] },
  { href: "/staff",             label: "Staff",                 icon: "UserCheck",     group: "academics", roles: ["admin"] },
  { href: "/attendance",        label: "Attendance",            icon: "ClipboardList", group: "academics", roles: ["admin","teacher"] },
  { href: "/gradebook",         label: "Gradebook",             icon: "BookOpen",      group: "academics", roles: ["admin","teacher"] },
  { href: "/exams",             label: "Examinations",          icon: "ClipboardList", group: "academics", roles: ["admin","teacher"] },
  { href: "/student/exams",     label: "My Exams",              icon: "ClipboardList", group: "academics", roles: ["student"] },
  { href: "/report-cards",      label: "Report Cards",          icon: "FileText",      group: "academics", roles: ["admin","teacher","student"] },
  { href: "/timetable",         label: "Timetable",             icon: "Calendar",      group: "academics", roles: ["admin","teacher","student","parent"] },
  { href: "/academic-calendar", label: "Academic Calendar",     icon: "Calendar",      group: "academics", roles: ["admin","teacher"] },
  { href: "/classes",           label: "Classes & Subjects",    icon: "GraduationCap", group: "academics", roles: ["admin"] },

  // ── campus ────────────────────────────────────────────────────────────────
  { href: "/library",           label: "Library",               icon: "BookOpen",      group: "campus", roles: ["admin","teacher","student"] },
  { href: "/health",            label: "Health",                icon: "Heart",         group: "campus", roles: ["admin"] },
  { href: "/transport",         label: "Transport",             icon: "Bus",           group: "campus", roles: ["admin"] },
  { href: "/hostel",            label: "Hostel",                icon: "Home",          group: "campus", roles: ["admin"] },
  { href: "/canteen",           label: "Canteen",               icon: "Utensils",      group: "campus", roles: ["admin"] },

  // ── finance ───────────────────────────────────────────────────────────────
  { href: "/fees",         label: "Fees",             icon: "Wallet",       group: "finance", roles: ["admin","accountant"] },
  { href: "/expenses",     label: "Expenses",         icon: "ShoppingCart", group: "finance", roles: ["admin","accountant"] },
  { href: "/scholarships", label: "Scholarships",     icon: "Award",        group: "finance", roles: ["admin","accountant"] },
  { href: "/payroll",      label: "Payroll",          icon: "Receipt",      group: "finance", roles: ["admin"] },
  { href: "/reports",      label: "Reports",          icon: "BarChart2",    group: "finance", roles: ["admin","accountant"] },
  { href: "/assets",       label: "Assets",           icon: "Package",      group: "finance", roles: ["admin"] },

  // ── management ────────────────────────────────────────────────────────────
  { href: "/user-role",          label: "Roles & Users",      icon: "UserCog",   group: "management", roles: ["admin"] },
  { href: "/admin/blocked-ips",  label: "Blocked IPs",        icon: "Shield",    group: "management", roles: ["admin"] },
  { href: "/approval-workflows", label: "Approvals",          icon: "GitBranch", group: "management", roles: ["admin"] },
  { href: "/audit-logs",         label: "Compliance Logs",    icon: "FileText",  group: "management", roles: ["admin"] },

  // ── communication ─────────────────────────────────────────────────────────
  { href: "/helpdesk",              label: "Support Tickets",    icon: "LifeBuoy", group: "communication", roles: ["admin"] },
  { href: "/parent-communications", label: "Parent Broadcasts",  icon: "Send",     group: "communication", roles: ["admin"] },

  // ── system ────────────────────────────────────────────────────────────────
  { href: "/documents",      label: "Document Center",  icon: "FolderOpen", group: "system", roles: ["admin"] },
  { href: "/backup-restore", label: "Backup & Restore", icon: "HardDrive",  group: "system", roles: ["admin"] },
  { href: "/system-health",  label: "System Health",    icon: "Activity",   group: "system", roles: ["admin"] },
  { href: "/offline-sync",   label: "Offline Sync",     icon: "Wifi",       group: "system", roles: ["admin"] },
  { href: "/settings",       label: "Settings",         icon: "Settings",   group: "system", roles: ["admin"] },

  // ── portals (role-specific home screens) ──────────────────────────────────
  { href: "/teacher-portal",    label: "My Classes",     icon: "GraduationCap", group: "portals", roles: ["teacher"] },
  { href: "/parent-portal",     label: "Fees",           icon: "Wallet",        group: "portals", roles: ["parent"] },
  { href: "/fees/receipt",      label: "Payment Receipts",icon: "Receipt",      group: "portals", roles: ["parent"] },
  { href: "/messages",          label: "Messages",       icon: "MessageSquare", group: "portals", roles: ["parent","teacher"] },
  { href: "/accountant-portal", label: "Finance Hub",    icon: "Wallet",        group: "portals", roles: ["accountant"] },
  { href: "/transport-portal",  label: "My Routes",      icon: "Truck",         group: "portals", roles: ["driver"] },
  { href: "/canteen-portal",    label: "Canteen",        icon: "Utensils",      group: "portals", roles: ["caterer"] },
  { href: "/health-portal",     label: "Health Clinic",  icon: "Heart",         group: "portals", roles: ["nurse"] },
  { href: "/security-portal",   label: "Security",       icon: "Lock",          group: "portals", roles: ["security"] },
  { href: "/my-payslips",       label: "My Payslips",    icon: "Receipt",       group: "portals", roles: ["accountant","driver","caterer","nurse","security"] },
];

export function getNavForRole(role: NavItem["roles"][0]) {
  return ALL_NAV_ITEMS.filter((item) => item.roles.includes(role));
}

export const NAV_ICON_MAP: Record<NavIconKey, LucideIcon> = {
  Activity, LayoutDashboard, Bell, Users, UserCheck, LogIn, ClipboardList,
  BookOpen, FileText, Calendar, Megaphone, Shield, Heart, Bus,
  Home, Wallet, Receipt, BarChart2, Package, UserCog, Wifi,
  Settings, GraduationCap, Utensils, Lock, Truck, ShoppingCart, Award,
  GitBranch, MessageSquare, Upload, Database, HardDrive, FolderOpen, LifeBuoy, Send,
  MoreHorizontal,
};
