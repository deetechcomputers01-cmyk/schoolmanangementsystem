import { test, expect } from "@playwright/test";
import { login } from "./helpers";

test.describe("Academic Calendar", () => {
  test("shows current year and terms", async ({ page }) => {
    await login(page, "principal");
    await page.goto("/academic-calendar");
    await expect(page.locator("body")).toContainText(/2025\/2026|2026/);
    await expect(page.locator("body")).toContainText(/Term/i);
  });

  test("shows active year banner", async ({ page }) => {
    await login(page, "super_admin");
    await page.goto("/academic-calendar");
    await expect(page.locator("body")).toContainText(/Active Year|Active Term|Current Academic/i);
  });

  test("principal can see Add Term button", async ({ page }) => {
    await login(page, "principal");
    await page.goto("/academic-calendar");
    // Expand the year card first by clicking it
    const yearCard = page.locator("text=2025/2026").first();
    await expect(yearCard).toBeVisible();
    await yearCard.click();
    await expect(page.locator("text=Add Term")).toBeVisible({ timeout: 5_000 });
  });

  test("teacher can view but not create year", async ({ page }) => {
    await login(page, "teacher");
    await page.goto("/academic-calendar");
    await expect(page.locator("body")).toContainText(/Term/i);
    await expect(page.locator("text=New Academic Year")).toHaveCount(0);
  });

  test("academic years API returns data", async ({ page }) => {
    await login(page, "super_admin");
    const resp = await page.request.get("/api/academic/years");
    expect(resp.status()).toBe(200);
    const data = await resp.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    expect(data[0]).toHaveProperty("terms");
  });
});
