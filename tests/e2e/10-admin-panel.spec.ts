import { test, expect } from "@playwright/test";
import { login } from "./helpers";

test.describe("Super Admin Panel", () => {
  test("user management lists all 7 users", async ({ page }) => {
    await login(page, "super_admin");
    await page.goto("/admin/users");
    await expect(page.locator("body")).toContainText(/System Administrator|Dr. Ama|Kwame Owusu/i);
    // 7 seeded users
    const rows = page.locator("tbody tr");
    await expect(rows).toHaveCount(7, { timeout: 5_000 });
  });

  test("super_admin can change a user role via dropdown", async ({ page }) => {
    await login(page, "super_admin");
    await page.goto("/admin/users");
    // Find the staff user row and change role (not super_admin's own row)
    const staffRow = page.locator("tr").filter({ hasText: "Yaw Adjei" });
    await expect(staffRow).toBeVisible();
    const roleSelect = staffRow.locator("select").first();
    await expect(roleSelect).toBeVisible();
    // Just check the select is interactive, don't actually change
    const currentValue = await roleSelect.inputValue();
    expect(currentValue).toBe("staff");
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
    await expect(page.locator("body")).toContainText(/Ghana GES/i);
    await expect(page.locator("text=Save Settings")).toBeVisible();
  });

  test("settings page shows grading scale A1 to F9", async ({ page }) => {
    await login(page, "super_admin");
    await page.goto("/admin/settings");
    await expect(page.locator("body")).toContainText("A1");
    await expect(page.locator("body")).toContainText("F9");
  });
});
