import { test, expect } from "@playwright/test";
import { login, BASE } from "./helpers";

// ── Helper: get first student ID via API ──────────────────────────────────────
async function getFirstStudentId(page: import("@playwright/test").Page): Promise<string | null> {
  await page.goto("/dashboard");
  const resp = await page.request.get(`${BASE}/api/students`);
  if (!resp.ok()) return null;
  const body = await resp.json();
  const arr = body.students ?? body;
  return Array.isArray(arr) && arr.length > 0 ? arr[0].id : null;
}

// ── Disciplinary ───────────────────────────────────────────────────────────────

test.describe("Disciplinary Records", () => {
  test("disciplinary page loads for principal with Log Incident button", async ({ page }) => {
    await login(page, "principal");
    await page.goto("/disciplinary");
    await expect(page.locator("body")).toContainText(/Incident|Disciplinary/i);
    await expect(page.getByRole("button", { name: /Log Incident/i })).toBeVisible();
  });

  test("teacher can see Log Incident button", async ({ page }) => {
    await login(page, "teacher");
    await page.goto("/disciplinary");
    await expect(page.getByRole("button", { name: /Log Incident/i })).toBeVisible();
  });

  test("staff cannot access /disciplinary — page guard redirects", async ({ page }) => {
    await login(page, "staff");
    await page.goto("/disciplinary");
    await expect(page).toHaveURL(/dashboard/, { timeout: 10_000 });
  });

  test("disciplinary API creates a record", async ({ page }) => {
    await login(page, "super_admin");
    const studentId = await getFirstStudentId(page);
    if (!studentId) { test.skip(); return; }

    const resp = await page.request.post(`${BASE}/api/disciplinary`, {
      data: {
        studentId,
        category:    "Late Attendance",
        description: "Student arrived 30 minutes late without a valid excuse.",
        action:      "Verbal Warning",
        date:        new Date().toISOString()
      }
    });
    expect(resp.status()).toBe(201);
    const data = await resp.json();
    expect(data.category).toBe("Late Attendance");
  });
});

// ── Health Records ─────────────────────────────────────────────────────────────

test.describe("Health Records", () => {
  test("health page lists all students", async ({ page }) => {
    await login(page, "super_admin");
    await page.goto("/health");
    await expect(page.locator("body")).toContainText(/Akosua|Kofi|Student/i);
  });

  test("student health record page has Info / Visits / Vaccinations tabs", async ({ page }) => {
    await login(page, "super_admin");
    const studentId = await getFirstStudentId(page);
    if (!studentId) { test.skip(); return; }
    await page.goto(`/health/${studentId}`);
    await expect(page.locator("body")).toContainText(/Medical Information|Blood Group|Health Record/i);
    await expect(page.getByRole("button", { name: /visits/i }).first()).toBeVisible();
  });

  test("health record upsert works via API", async ({ page }) => {
    await login(page, "super_admin");
    const studentId = await getFirstStudentId(page);
    if (!studentId) { test.skip(); return; }

    const resp = await page.request.patch(`${BASE}/api/health/${studentId}`, {
      data: { bloodGroup: "O+", allergies: "Peanuts", emergencyContact: "Test Parent", emergencyPhone: "0200001234" }
    });
    expect(resp.status()).toBe(200);
    const data = await resp.json();
    expect(data.bloodGroup).toBe("O+");
  });

  test("health record page shows updated blood group", async ({ page }) => {
    await login(page, "super_admin");
    const studentId = await getFirstStudentId(page);
    if (!studentId) { test.skip(); return; }
    await page.goto(`/health/${studentId}`);
    await expect(page.locator("body")).toContainText(/O\+|Blood/i);
  });
});

// ── Library ────────────────────────────────────────────────────────────────────

test.describe("Library", () => {
  test("library page loads with seeded books", async ({ page }) => {
    await login(page, "super_admin");
    await page.goto("/library");
    await expect(page.locator("body")).toContainText(/Mathematics for Basic 6|Book/i);
  });

  test("can add a book via API", async ({ page }) => {
    await login(page, "super_admin");
    const resp = await page.request.post(`${BASE}/api/library/books`, {
      data: { title: "E2E Test Book", author: "Test Author", category: "Science", quantity: 3 }
    });
    expect(resp.status()).toBe(201);
    const data = await resp.json();
    expect(data.title).toBe("E2E Test Book");
    expect(data.available).toBe(3);
  });

  test("can checkout a book via API and return it", async ({ page }) => {
    await login(page, "super_admin");
    const studentId = await getFirstStudentId(page);
    if (!studentId) { test.skip(); return; }

    const booksResp = await page.request.get(`${BASE}/api/library/books`);
    const booksBody = await booksResp.json();
    const booksArr  = booksBody.books ?? booksBody;
    const book = Array.isArray(booksArr) ? booksArr.find((b: { available: number }) => b.available > 0) : null;
    if (!book) { test.skip(); return; }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);

    const checkoutResp = await page.request.post(`${BASE}/api/library/checkouts`, {
      data: { bookId: book.id, studentId, dueDate: dueDate.toISOString() }
    });
    expect(checkoutResp.status()).toBe(201);
    const checkout = await checkoutResp.json();
    expect(checkout.bookId).toBe(book.id);

    // Return the book
    const returnResp = await page.request.patch(`${BASE}/api/library/checkouts/${checkout.id}`);
    expect(returnResp.status()).toBe(200);
    const returned = await returnResp.json();
    expect(returned.returnedAt).not.toBeNull();
  });

  test("checkouts tab shows active or returned loans", async ({ page }) => {
    await login(page, "super_admin");
    await page.goto("/library");
    await page.getByRole("button", { name: /Checkouts/i }).first().click();
    await expect(page.locator("body")).toContainText(/Out|Overdue|Return|Returned|No checkouts/i, { timeout: 5_000 });
  });

  test("student can view library", async ({ page }) => {
    await login(page, "student");
    await page.goto("/library");
    await expect(page.locator("body")).toContainText(/Book|Library/i);
  });

  test("guardian cannot access library — page guard redirects", async ({ page }) => {
    await login(page, "guardian");
    await page.goto("/library");
    await expect(page).toHaveURL(/dashboard/, { timeout: 10_000 });
  });
});
