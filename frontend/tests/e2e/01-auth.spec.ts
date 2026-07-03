import { test, expect } from "@playwright/test";
import { login, logout, ACCOUNTS, BASE } from "./helpers";

test.describe("Authentication", () => {
  test("login page loads and shows form", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test("wrong credentials returns 401", async ({ page }) => {
    const resp = await page.request.post(`${BASE}/api/auth/login`, {
      data: { email: ACCOUNTS.super_admin.email, password: "WrongPassword!" }
    });
    expect(resp.status()).toBe(401);
  });

  test("UI login shows error on wrong password", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', ACCOUNTS.super_admin.email);
    await page.fill('input[type="password"]', "BadPass999!");
    await page.click('button[type="submit"]');
    await expect(page.locator("body")).toContainText(/invalid|incorrect|wrong/i, { timeout: 8_000 });
  });

  // API-based login tests (fast and reliable)
  test("super_admin can log in and reach dashboard", async ({ page }) => {
    await login(page, "super_admin");
    await page.goto("/dashboard");
    await expect(page.locator("body")).toContainText(/Dashboard|Students/i, { timeout: 10_000 });
  });

  test("principal can log in and reach dashboard", async ({ page }) => {
    await login(page, "principal");
    await page.goto("/dashboard");
    await expect(page.locator("body")).toContainText(/Dashboard/i, { timeout: 10_000 });
  });

  test("teacher can log in and reach their dashboard", async ({ page }) => {
    await login(page, "teacher");
    await page.goto("/dashboard");
    await expect(page.locator("body")).toContainText(/My Subjects|Dashboard/i, { timeout: 10_000 });
  });

  test("staff can log in and reach their dashboard", async ({ page }) => {
    await login(page, "staff");
    await page.goto("/dashboard");
    await expect(page.locator("body")).toContainText(/Pending Fees|Dashboard/i, { timeout: 10_000 });
  });

  test("student logs in and can view portal", async ({ page }) => {
    await login(page, "student");
    await page.goto("/portal");
    await expect(page.locator("body")).toContainText(/Akosua|Welcome|Portal/i, { timeout: 10_000 });
  });

  test("guardian logs in and can view portal", async ({ page }) => {
    await login(page, "guardian");
    await page.goto("/portal");
    await expect(page.locator("body")).toContainText(/Parent Portal|Guardian/i, { timeout: 10_000 });
  });

  test("protected API returns 401 for a role that lacks access (no auth test)", async ({ page }) => {
    // We test session protection via the logout flow:
    // verify the admin user management API returns 401 when no session exists.
    // After logging in then out, the cookie is gone — this is more reliable
    // than clearing cookies mid-session due to Playwright httpOnly cookie behaviour.
    await login(page, "super_admin");
    await page.goto("/dashboard");
    const authed = await page.request.get(`${BASE}/api/admin/users`);
    expect(authed.status()).toBe(200);
    await logout(page);
    const unauthed = await page.request.get(`${BASE}/api/admin/users`);
    expect(unauthed.status()).toBe(401);
  });

  test("logout clears session — dashboard is inaccessible after logout", async ({ page }) => {
    await login(page, "super_admin");
    await page.goto("/dashboard");
    await expect(page.locator("body")).toContainText(/Dashboard/i, { timeout: 10_000 });
    // Logout
    await logout(page);
    // After logout, admin API should reject
    const resp = await page.request.get(`${BASE}/api/admin/users`);
    expect(resp.status()).toBe(401);
  });
});
