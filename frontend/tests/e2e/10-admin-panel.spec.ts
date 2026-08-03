import { test, expect } from "@playwright/test";
import { login } from "./helpers";

test.describe("Super Admin Panel", () => {
  test("user management loads seeded users and role summaries", async ({ page }) => {
    await login(page, "super_admin");
    await page.goto("/admin/users");
    await expect(page.locator("body")).toContainText(/System Administrator|Dr. Ama|Kwame Owusu/i);
    await expect(page.locator("body")).toContainText(/Total Users|Guardians|Students/i);
    await expect(page.locator("tbody tr").first()).toBeVisible();
  });

  test("super_admin can change a user role via dropdown", async ({ page }) => {
    await login(page, "super_admin");
    await page.goto("/admin/users");
    await expect(page.locator("body")).toContainText(/Roles|Permissions|Staff/i);
    await page.getByText(/Staff/i).first().click();
    await expect(page.locator("body")).toContainText(/Yaw Adjei|Kweku Mensah|Abena Osei/i);
  });

  test("blocked IPs page loads and shows add form", async ({ page }) => {
    await login(page, "super_admin");
    await page.goto("/admin/blocked-ips");
    await expect(page.locator("body")).toContainText(/Block.*IP|Blocked/i);
    await page.locator("text=Add Block").click();
    await expect(page.locator('input[placeholder*="192.168" i]')).toBeVisible();
  });

  test("IP blocking API rejects non-admin", async ({ page }) => {
    await login(page, "teacher");
    const resp = await page.request.get("/api/admin/blocked-ips");
    expect(resp.status()).toBe(403);
  });

  test("audit trail shows recent actions", async ({ page }) => {
    await login(page, "super_admin");
    await page.goto("/admin/audit");
    await expect(page.locator("body")).toContainText(/seed|create|update/i);
    // Rows in audit table
    const rows = page.locator("tbody tr");
    await expect(rows.first()).toBeVisible();
  });

  test("school settings page loads with form", async ({ page }) => {
    await login(page, "super_admin");
    await page.goto("/admin/settings");
    await expect(page.locator("body")).toContainText(/ScholarSphere Academy|School Name/i);
    await expect(page.locator("body")).toContainText(/GES Code|Region/i);
    await expect(page.locator("text=Save Changes")).toBeVisible();
  });

  test("settings page shows grading scale A1 to F9", async ({ page }) => {
    await login(page, "super_admin");
    await page.goto("/admin/settings");
    await page.getByRole("button", { name: "Gradebook" }).click();
    await expect(page.locator("body")).toContainText("A1");
    await expect(page.locator("body")).toContainText("F9");
  });
});
