import { test, expect } from "@playwright/test";
import { login, BASE } from "./helpers";

test.describe("Attendance", () => {
  test("teacher can view attendance page", async ({ page }) => {
    await login(page, "teacher");
    await page.goto("/attendance");
    await expect(page.locator("body")).toContainText(/attendance|Attendance/i);
  });

  test("principal can view attendance", async ({ page }) => {
    await login(page, "principal");
    await page.goto("/attendance");
    await expect(page.locator("body")).toContainText(/attendance|Attendance/i);
  });

  test("attendance API returns data for authenticated user", async ({ page }) => {
    await login(page, "super_admin");
    await page.goto("/dashboard");   // navigate first to ensure cookies are active
    const resp = await page.request.get(`${BASE}/api/attendance`);
    expect(resp.status()).toBe(200);
    // Original API wraps in { attendance: [...] }
    const data = await resp.json();
    expect(data).toHaveProperty("attendance");
    expect(Array.isArray(data.attendance)).toBe(true);
  });

  test("staff cannot access /attendance page — page guard redirects", async ({ page }) => {
    await login(page, "staff");
    await page.goto("/attendance");
    await expect(page).toHaveURL(/dashboard/, { timeout: 10_000 });
  });

  test("unauthenticated access to attendance page redirects to login", async ({ page }) => {
    await page.goto("/attendance");
    await expect(page).toHaveURL(/login/, { timeout: 10_000 });
  });
});
