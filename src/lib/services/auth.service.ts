import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/types/auth";

export async function login(email: string, password: string): Promise<SessionUser> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error("Unauthorized");
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new Error("Unauthorized");
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}
