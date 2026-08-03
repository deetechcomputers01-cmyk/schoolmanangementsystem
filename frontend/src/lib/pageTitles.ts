export const PAGE_TITLES: Record<string, string> = {
  "/dashboard":          "Dashboard",
  "/students":           "Students",
  "/staff":              "Staff",
  "/attendance":         "Attendance",
  "/attendance/reports": "Attendance Reports",
  "/gradebook":          "Gradebook",
  "/gradebook/reports":  "Gradebook Reports",
  "/exams":              "Examinations",
  "/report-cards":       "Report Cards",
  "/timetable":          "Timetable",
  "/timetable-setup":    "Timetable Setup",
  "/academic-calendar":  "Academic Calendar",
  "/library":            "Library",
  "/health":             "Health & Clinic",
  "/transport":          "Transport",
  "/hostel":              "Hostel",
  "/classes":            "Classes",
  "/fees":               "Fees & Payments",
  "/fees/receipt":       "Payment Receipts",
  "/expenses":           "Expenses",
  "/scholarships":       "Scholarships",
  "/payroll":            "Payroll",
  "/my-payslips":        "My Payslips",
  "/reports":            "Reports",
  "/assets":             "Assets",
  "/announcements":      "Announcements",
  "/notifications":      "Notifications",
  "/audit-logs":          "Compliance Logs",
  "/system-health":       "System Health",
  "/offline-sync":        "Offline Sync",
  "/canteen":             "Canteen",
  "/settings":            "Settings",
  "/user-role":           "Roles & Users",
  "/admin/blocked-ips":   "Blocked IPs",
  "/parent-portal":       "Parent Portal",
  "/accountant-portal":   "Accountant Portal",
  "/approval-workflows":  "Approval Workflows",
  "/timetable/manage":    "Timetable Setup",
  "/canteen-portal":      "Canteen Portal",
  "/health-portal":       "Health Clinic",
  "/transport-portal":    "Transport Portal",
  "/security-portal":     "Security Portal",
  "/teacher-portal":      "My Classes",
  "/helpdesk":            "Support Tickets",
  "/parent-communications": "Parent Broadcasts",
};

export function deriveTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  if (pathname.startsWith("/students/")) {
    return "Student Profile";
  }
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length >= 2) {
    const base = "/" + segments[0];
    if (PAGE_TITLES[base]) return PAGE_TITLES[base];
  }
  return "";
}
