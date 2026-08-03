import bcrypt from "bcryptjs";
import { prisma } from "../prisma";
import type { SessionUser } from "@/types/auth";
import { audit } from "./audit.service";
import { assertCan } from "../auth/rbac";
import { getSettings } from "./settings.service";

export async function login(email: string, password: string): Promise<SessionUser> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    await audit(null, "login_failed", "User", email, { email, reason: "no such user" });
    throw new Error("Unauthorized");
  }
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    await audit(null, "login_failed", "User", user.id, { email });
    throw new Error("Unauthorized");
  }
  const sessionUser = { id: user.id, name: user.name, email: user.email, role: user.role };
  await audit(sessionUser, "login_success", "User", user.id, { email });
  return sessionUser;
}

export async function resetUserPassword(actor: SessionUser | null, userId: string): Promise<string> {
  assertCan(actor, "staff:write");
  const settings = await getSettings();
  const ex = (settings.extra ?? {}) as Record<string, unknown>;
  const minLength = Math.max(Number(ex.minPasswordLength) || 8, 8);

  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const tempPassword = Array.from({ length: minLength }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("");

  const passwordHash = await bcrypt.hash(tempPassword, 12);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash, passwordChangedAt: new Date() },
  });
  await audit(actor, "reset_password", "User", userId, {});
  return tempPassword;
}
