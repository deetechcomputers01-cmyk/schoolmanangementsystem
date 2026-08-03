import { test, expect } from "@playwright/test";
import { login } from "./helpers";

test.describe("Student Management", () => {
  test("principal can view students list", async ({ page }) => {
    await login(page, "principal");
    await page.goto("/students");
    await expect(page.locator("body")).toContainText(/Akosua|Kofi|Abena/i);
  });

  test("teacher can view students list", async ({ page }) => {
    await login(page, "teacher");
    await page.goto("/students");
    await expect(page.locator("body")).toContainText(/student/i);
  });

  test("students list shows student names and classes", async ({ page }) => {
    await login(page, "super_admin");
    await page.goto("/students");
    await expect(page.locator("body")).toContainText(/Basic 6|JHS 1/i);
  });

  test("can navigate to student detail page", async ({ page }) => {
    await login(page, "super_admin");
    await page.goto("/students");
    // Click first student link
    const firstLink = page.locator("a[href^='/students/']").first();
    await expect(firstLink).toBeVisible({ timeout: 5_000 });
    await firstLink.click();
    await expect(page).toHaveURL(/\/students\//);
  });

  test("add student modal opens for principal", async ({ page }) => {
    await login(page, "principal");
    await page.goto("/students");
    await page.getByRole("button", { name: /add student/i }).click();
    await expect(page.locator("body")).toContainText(/Full Name/i);
  });
});
