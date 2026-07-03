import { test, expect } from "@playwright/test";
import { login, BASE } from "./helpers";

test.describe("Payroll Module", () => {
  test("payroll page loads for super_admin", async ({ page }) => {
    await login(page, "super_admin");
    await page.goto("/payroll");
    await expect(page.locator("body")).toContainText(/Salary|Payroll/i);
    await expect(page.locator("text=Salary Setup")).toBeVisible();
  });

  test("shows staff names in payroll", async ({ page }) => {
    await login(page, "super_admin");
    await page.goto("/payroll");
    await expect(page.locator("body")).toContainText(/Kwame Owusu|Efua Boateng|Yaw Adjei/i);
  });

  test("super_admin can set salary via API", async ({ page }) => {
    await login(page, "super_admin");
    await page.goto("/dashboard");  // prime browser cookies
    const staffResp = await page.request.get(`${BASE}/api/staff`);
    const body = await staffResp.json();
    // Original route returns { staff: [...] }
    const staffArr = body.staff ?? body;
    if (!Array.isArray(staffArr) || staffArr.length === 0) {
      test.skip(); return;
    }
    const firstStaff = staffArr[0];
    const resp = await page.request.post(`${BASE}/api/payroll/salaries/${firstStaff.id}`, {
      data: {
        basicSalary: 2500,
        allowances: 300,
        deductions: 150,
        effectiveFrom: new Date("2026-01-01").toISOString()
      }
    });
    expect(resp.status()).toBe(200);
    const data = await resp.json();
    expect(Number(data.basicSalary)).toBe(2500);
  });

  test("can switch to Payslips tab", async ({ page }) => {
    await login(page, "super_admin");
    await page.goto("/payroll");
    await page.getByRole("button", { name: "Payslips" }).click();
    await expect(page.locator("body")).toContainText(/Payslip|Month|No payslips/i);
  });

  test("principal can access payroll", async ({ page }) => {
    await login(page, "principal");
    await page.goto("/payroll");
    await expect(page.locator("body")).toContainText(/Payroll|Salary/i);
  });

  test("teacher cannot access payroll — redirected", async ({ page }) => {
    await login(page, "teacher");
    await page.goto("/payroll");
    await expect(page).toHaveURL(/dashboard/, { timeout: 10_000 });
  });
});
