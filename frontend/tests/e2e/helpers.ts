import { type Page, expect } from "@playwright/test";

export const BASE = "http://localhost:3000";

export const ACCOUNTS = {
  super_admin: { email: "superadmin@scholarsphere.edu.gh", password: "Password123!", role: "super_admin" },
  principal:   { email: "principal@scholarsphere.edu.gh",  password: "Password123!", role: "principal" },
  teacher:     { email: "teacher1@scholarsphere.edu.gh",   password: "Password123!", role: "teacher" },
  staff:       { email: "staff@scholarsphere.edu.gh",      password: "Password123!", role: "staff" },
  student:     { email: "akosua.student@scholarsphere.edu.gh", password: "Password123!", role: "student" },
  guardian:    { email: "asare.guardian@scholarsphere.edu.gh", password: "Password123!", role: "guardian" },
} as const;

/**
 * Login via the API (much faster + reliable than driving the UI form).
 * page.request shares the cookie jar with the page, so the session
 * cookie is set on the page automatically.
 */
export async function login(page: Page, role: keyof typeof ACCOUNTS) {
  const acc = ACCOUNTS[role];
  const resp = await page.request.post(`${BASE}/api/auth/login`, {
    data: { email: acc.email, password: acc.password }
  });
  if (!resp.ok()) {
    const body = await resp.text();
    throw new Error(`API login failed for ${role} (${resp.status()}): ${body}`);
  }
}

export async function logout(page: Page) {
  await page.request.post(`${BASE}/api/auth/logout`);
}

export async function expectVisible(page: Page, text: string | RegExp, timeout = 10_000) {
  await expect(page.locator("body")).toContainText(text, { timeout });
}
