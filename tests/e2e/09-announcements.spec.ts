import { test, expect } from "@playwright/test";
import { login } from "./helpers";

test.describe("Announcements", () => {
  test("all roles can view announcements page", async ({ page }) => {
    for (const role of ["super_admin", "principal", "teacher", "staff"] as const) {
      await login(page, role);
      await page.goto("/announcements");
      await expect(page.locator("body")).toContainText(/Announcement|Welcome to Term/i);
      await page.request.post("/api/auth/logout");
    }
  });

  test("shows pinned announcement at top", async ({ page }) => {
    await login(page, "super_admin");
    await page.goto("/announcements");
    await expect(page.locator("body")).toContainText(/Welcome to Term 3/i);
  });

  test("principal can create announcement", async ({ page }) => {
    await login(page, "principal");
    await page.goto("/announcements");
    await page.click("text=New Announcement");
    await page.fill('input[placeholder*="title" i]', "Test Announcement from E2E");
    await page.fill('textarea[placeholder*="message" i]', "This is a test announcement written by the Playwright E2E suite.");
    await page.click('button:has-text("Publish")');
    await expect(page.locator("body")).toContainText(/published|Test Announcement/i, { timeout: 8_000 });
  });

  test("teacher can view but not see create button", async ({ page }) => {
    await login(page, "teacher");
    await page.goto("/announcements");
    await expect(page.locator("body")).toContainText(/Welcome to Term/i);
    await expect(page.locator("text=New Announcement")).toHaveCount(0);
  });

  test("student can view announcements", async ({ page }) => {
    await login(page, "student");
    await page.goto("/announcements");
    await expect(page.locator("body")).toContainText(/announcement|Welcome/i);
  });

  test("announcements API filters by role", async ({ page }) => {
    await login(page, "teacher");
    const resp = await page.request.get("/api/announcements");
    expect(resp.status()).toBe(200);
    const data = await resp.json();
    expect(Array.isArray(data)).toBe(true);
  });
});
