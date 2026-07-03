import { test, expect } from "@playwright/test";
import { login, BASE } from "./helpers";

test.describe("Examinations & Report Cards", () => {
  test("exams page loads for principal and shows New Exam button", async ({ page }) => {
    await login(page, "principal");
    await page.goto("/exams");
    await expect(page.locator("body")).toContainText(/Exam|exam/i);
    // Use button role to avoid strict mode violation from help text
    await expect(page.getByRole("button", { name: "New Exam" })).toBeVisible();
  });

  test("teacher can see exams list", async ({ page }) => {
    await login(page, "teacher");
    await page.goto("/exams");
    await expect(page.locator("body")).toContainText(/Exam|exam/i);
  });

  test("exams API returns array", async ({ page }) => {
    await login(page, "super_admin");
    await page.goto("/dashboard");
    const resp = await page.request.get(`${BASE}/api/exams`);
    expect(resp.status()).toBe(200);
    const data = await resp.json();
    expect(Array.isArray(data)).toBe(true);
  });

  test("report cards page loads for principal", async ({ page }) => {
    await login(page, "principal");
    await page.goto("/report-cards");
    await expect(page.locator("body")).toContainText(/Report Card|Basic 6|JHS 1/i);
  });

  test("student report card page renders", async ({ page }) => {
    await login(page, "super_admin");
    await page.goto("/dashboard");
    // Get student ID from API (now uses original wrapped format)
    const resp = await page.request.get(`${BASE}/api/students`);
    const data = await resp.json();
    const students = data.students ?? data;
    if (!Array.isArray(students) || students.length === 0) {
      test.skip();
      return;
    }
    const id = students[0].id;
    await page.goto(`/report-cards/${id}`);
    await expect(page.locator("body")).toContainText(/Report Card|ScholarSphere/i);
    await expect(page.getByRole("button", { name: /Print/i })).toBeVisible();
  });

  test("report card shows Ghana GES grades", async ({ page }) => {
    await login(page, "super_admin");
    await page.goto("/dashboard");
    const resp = await page.request.get(`${BASE}/api/students`);
    const data = await resp.json();
    const students = data.students ?? data;
    if (!Array.isArray(students) || students.length === 0) {
      test.skip();
      return;
    }
    const id = students[0].id;
    await page.goto(`/report-cards/${id}`);
    await expect(page.locator("body")).toContainText(/A1|B2|C4/i);
  });
});
