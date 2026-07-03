import { test, expect } from "@playwright/test";
import { login, BASE } from "./helpers";

test.describe("Admissions Module", () => {
  test("admissions page loads for principal", async ({ page }) => {
    await login(page, "principal");
    await page.goto("/admissions");
    await expect(page.locator("body")).toContainText(/Application|Admission/i);
  });

  test("seeded pending application is visible", async ({ page }) => {
    await login(page, "principal");
    await page.goto("/admissions");
    await expect(page.locator("body")).toContainText(/Abena.*Kyei|Kyei|pending/i);
  });

  test("staff can view admissions page", async ({ page }) => {
    await login(page, "staff");
    await page.goto("/admissions");
    await expect(page.locator("body")).toContainText(/Application|Admission/i);
  });

  test("New Application button appears for principal", async ({ page }) => {
    await login(page, "principal");
    await page.goto("/admissions");
    await expect(page.getByRole("button", { name: /New Application/i })).toBeVisible();
    await page.getByRole("button", { name: /New Application/i }).click();
    await expect(page.locator("text=New Admission Application")).toBeVisible({ timeout: 5_000 });
  });

  test("admissions API creates application", async ({ page }) => {
    await login(page, "super_admin");
    const resp = await page.request.post(`${BASE}/api/admissions`, {
      data: {
        firstName: "Ama", lastName: "E2ETest", gender: "Female",
        dateOfBirth: new Date("2014-01-01").toISOString(),
        address: "Test Address, Accra",
        applyingForClass: "Basic 6",
        guardianName: "Kwame Test", guardianPhone: "0200000001",
        guardianRelation: "Parent"
      }
    });
    expect(resp.status()).toBe(201);
    const data = await resp.json();
    expect(data.status).toBe("pending");
    expect(data.firstName).toBe("Ama");
  });

  test("principal can approve application via API", async ({ page }) => {
    await login(page, "principal");
    const listResp = await page.request.get(`${BASE}/api/admissions`);
    const apps = await listResp.json();
    const pending = Array.isArray(apps) ? apps.find((a: { status: string }) => a.status === "pending") : null;
    if (!pending) { test.skip(); return; }

    const resp = await page.request.patch(`${BASE}/api/admissions/${pending.id}`, {
      data: { status: "approved" }
    });
    expect(resp.status()).toBe(200);
    const updated = await resp.json();
    expect(updated.status).toBe("approved");
    expect(updated.admissionNo).toBeTruthy();
  });
});
