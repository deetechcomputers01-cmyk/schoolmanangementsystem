import { test, expect } from "@playwright/test";
import { login, BASE } from "./helpers";

test.describe("Fees & Payments", () => {
  test("principal can view fees", async ({ page }) => {
    await login(page, "principal");
    await page.goto("/fees");
    await expect(page.locator("body")).toContainText(/fee|Fee/i);
  });

  test("staff can view fees", async ({ page }) => {
    await login(page, "staff");
    await page.goto("/fees");
    await expect(page.locator("body")).toContainText(/fee|Fee/i);
  });

  test("teacher cannot access /fees — page guard redirects to dashboard", async ({ page }) => {
    await login(page, "teacher");
    await page.goto("/fees");
    await expect(page).toHaveURL(/dashboard/, { timeout: 10_000 });
  });

  test("fees API returns { fees: [...] } for super_admin", async ({ page }) => {
    await login(page, "super_admin");
    await page.goto("/dashboard");  // navigate first to prime cookies in browser
    const resp = await page.request.get(`${BASE}/api/fees`);
    expect(resp.status()).toBe(200);
    const data = await resp.json();
    // Original route returns { fees: [...] }
    expect(data).toHaveProperty("fees");
    expect(Array.isArray(data.fees)).toBe(true);
    expect(data.fees.length).toBeGreaterThan(0);
    expect(data.fees[0]).toHaveProperty("amountDue");
  });

  test("unauthenticated access to fees page redirects to login", async ({ page }) => {
    await page.goto("/fees");
    await expect(page).toHaveURL(/login/, { timeout: 10_000 });
  });

  test("payments page loads", async ({ page }) => {
    await login(page, "super_admin");
    await page.goto("/fees/payments");
    await expect(page.locator("body")).toContainText(/payment|Payment/i);
  });

  test("invoices page loads", async ({ page }) => {
    await login(page, "super_admin");
    await page.goto("/fees/invoices");
    await expect(page.locator("body")).toContainText(/invoice|Invoice|fee|Fee/i);
  });
});
