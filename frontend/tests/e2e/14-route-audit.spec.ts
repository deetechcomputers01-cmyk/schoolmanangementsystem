import { expect, test, type Page } from "@playwright/test";
import { login, BASE, ACCOUNTS } from "./helpers";

type Role = keyof typeof ACCOUNTS;

type RouteCase = {
  path: string;
  role: Role;
  label: string;
};

const STATIC_ROUTES: RouteCase[] = [
  { path: "/dashboard", role: "super_admin", label: "Dashboard" },
  { path: "/notifications", role: "super_admin", label: "Notifications" },
  { path: "/announcements", role: "super_admin", label: "Announcements" },
  { path: "/students", role: "super_admin", label: "Students" },
  { path: "/staff", role: "super_admin", label: "Staff" },
  { path: "/attendance", role: "teacher", label: "Attendance" },
  { path: "/attendance/reports", role: "super_admin", label: "Attendance Reports" },
  { path: "/gradebook", role: "teacher", label: "Gradebook" },
  { path: "/gradebook/reports", role: "super_admin", label: "Gradebook Reports" },
  { path: "/exams", role: "principal", label: "Exams" },
  { path: "/report-cards", role: "principal", label: "Report Cards" },
  { path: "/timetable", role: "super_admin", label: "Timetable" },
  { path: "/timetable/manage", role: "super_admin", label: "Timetable Manage" },
  { path: "/academic-calendar", role: "principal", label: "Academic Calendar" },
  { path: "/academic-year", role: "principal", label: "Academic Year" },
  { path: "/classes", role: "principal", label: "Classes" },
  { path: "/library", role: "super_admin", label: "Library" },
  { path: "/health", role: "super_admin", label: "Health" },
  { path: "/transport", role: "super_admin", label: "Transport" },
  { path: "/hostel", role: "super_admin", label: "Hostel" },
  { path: "/canteen", role: "super_admin", label: "Canteen" },
  { path: "/fees", role: "super_admin", label: "Fees" },
  { path: "/fees/invoices", role: "super_admin", label: "Fee Invoices" },
  { path: "/fees/receipt", role: "super_admin", label: "Payment Receipt" },
  { path: "/expenses", role: "super_admin", label: "Expenses" },
  { path: "/scholarships", role: "super_admin", label: "Scholarships" },
  { path: "/payroll", role: "super_admin", label: "Payroll" },
  { path: "/reports", role: "super_admin", label: "Reports" },
  { path: "/assets", role: "super_admin", label: "Assets" },
  { path: "/user-role", role: "super_admin", label: "Roles & Users" },
  { path: "/admin/users", role: "super_admin", label: "Admin Users Alias" },
  { path: "/admin/blocked-ips", role: "super_admin", label: "Blocked IPs" },
  { path: "/admin/audit", role: "super_admin", label: "Admin Audit Alias" },
  { path: "/admin/settings", role: "super_admin", label: "Admin Settings Alias" },
  { path: "/approval-workflows", role: "super_admin", label: "Approval Workflows" },
  { path: "/audit-logs", role: "super_admin", label: "Audit Logs" },
  { path: "/helpdesk", role: "super_admin", label: "Helpdesk" },
  { path: "/parent-communications", role: "super_admin", label: "Parent Communications" },
  { path: "/documents", role: "super_admin", label: "Documents" },
  { path: "/backup-restore", role: "super_admin", label: "Backup Restore" },
  { path: "/system-health", role: "super_admin", label: "System Health" },
  { path: "/offline-sync", role: "super_admin", label: "Offline Sync" },
  { path: "/settings", role: "super_admin", label: "Settings" },
  { path: "/teacher-portal", role: "teacher", label: "Teacher Portal" },
  { path: "/parent-portal", role: "guardian", label: "Parent Portal" },
  { path: "/accountant-portal", role: "staff", label: "Accountant Portal" },
  { path: "/messages", role: "guardian", label: "Messages" },
  { path: "/transport-portal", role: "driver", label: "Transport Portal" },
  { path: "/canteen-portal", role: "caterer", label: "Canteen Portal" },
  { path: "/health-portal", role: "nurse", label: "Health Portal" },
  { path: "/security-portal", role: "security", label: "Security Portal" },
];

async function dynamicRoutes(page: Page): Promise<RouteCase[]> {
  await login(page, "super_admin");

  const studentsResp = await page.request.get(`${BASE}/api/students`);
  const studentsBody = studentsResp.ok() ? await studentsResp.json() : {};
  const students = studentsBody.students ?? studentsBody;
  const studentId = Array.isArray(students) ? students[0]?.id : null;

  const staffResp = await page.request.get(`${BASE}/api/staff`);
  const staffBody = staffResp.ok() ? await staffResp.json() : {};
  const staff = staffBody.staff ?? staffBody;
  const staffId = Array.isArray(staff) ? staff[0]?.id : null;

  const examsResp = await page.request.get(`${BASE}/api/exams`);
  const exams = examsResp.ok() ? await examsResp.json() : [];
  const examId = Array.isArray(exams) ? exams[0]?.id : null;

  return [
    studentId && { path: `/students/${studentId}`, role: "super_admin", label: "Student Detail" },
    studentId && { path: `/report-cards/${studentId}`, role: "super_admin", label: "Student Report Card" },
    studentId && { path: `/health/${studentId}`, role: "super_admin", label: "Student Health Record" },
    staffId && { path: `/staff/${staffId}`, role: "super_admin", label: "Staff Detail" },
    staffId && { path: `/staff/${staffId}/edit`, role: "super_admin", label: "Staff Edit" },
    examId && { path: `/exams/${examId}`, role: "super_admin", label: "Exam Detail" },
  ].filter(Boolean) as RouteCase[];
}

async function auditRoute(page: Page, route: RouteCase, viewport: "desktop" | "mobile") {
  const errors: string[] = [];
  page.on("console", (msg) => {
    const text = msg.text();
    const isDevRefreshNoise =
      text.includes("Failed to fetch RSC payload") ||
      text.includes("The user aborted a request") ||
      text.includes("Abort fetching component for route");
    if (msg.type() === "error" && !isDevRefreshNoise) errors.push(text);
  });
  page.on("pageerror", (error) => errors.push(error.message));

  await page.setViewportSize(viewport === "desktop" ? { width: 1440, height: 1000 } : { width: 390, height: 844 });
  await login(page, route.role);
  const response = await page.goto(route.path, { waitUntil: "domcontentloaded", timeout: 20_000 });
  expect(response?.status(), `${viewport} ${route.path} HTTP status`).toBeLessThan(400);

  const body = page.locator("body");
  await expect(body).toBeVisible();
  await expect(body, `${viewport} ${route.path} body renders`).not.toContainText(/404This page could not be found|Application error|Internal Server Error/i);
  await expect(body, `${viewport} ${route.path} is not unfinished placeholder`).not.toContainText(/Design pending\. Structure ready\./i);
  expect(errors, `${viewport} ${route.path} console/page errors`).toEqual([]);
}

test.describe("Route Audit", () => {
  test.setTimeout(180_000);

  test("desktop routes render without errors or unfinished placeholders", async ({ page }) => {
    const routes = [...STATIC_ROUTES, ...(await dynamicRoutes(page))];
    for (const route of routes) {
      await auditRoute(page, route, "desktop");
    }
  });

  test("mobile viewport routes render without errors or unfinished placeholders", async ({ page }) => {
    const routes = [...STATIC_ROUTES, ...(await dynamicRoutes(page))];
    for (const route of routes) {
      await auditRoute(page, route, "mobile");
    }
  });
});
