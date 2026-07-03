import { redirect } from "next/navigation";
import { getCurrentUser } from "./cookies";
import type { Role } from "@prisma/client";

/**
 * Server-component role guard. Call at the top of any restricted page.tsx.
 * Redirects to /login if unauthenticated, to /dashboard if wrong role.
 */
export async function requireRole(...allowedRoles: Role[]) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!allowedRoles.includes(user.role)) redirect("/dashboard");
  return user;
}
