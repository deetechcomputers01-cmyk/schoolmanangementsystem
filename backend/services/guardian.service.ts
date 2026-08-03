import bcrypt from "bcryptjs";
import { prisma } from "../prisma";

interface CreateGuardianInput {
  studentId: string;
  name: string;
  relation: string;
  phone: string;
  email?: string;
  createLogin?: boolean;
}

export async function createGuardian(input: CreateGuardianInput) {
  const { studentId, name, relation, phone, email, createLogin } = input;

  let userId: string | undefined;
  let tempPassword: string | undefined;

  if (createLogin && email) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new Error("EMAIL_EXISTS");

    // Generate a readable 10-char temporary password
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    tempPassword = Array.from({ length: 10 }, () =>
      chars[Math.floor(Math.random() * chars.length)]
    ).join("");

    const passwordHash = await bcrypt.hash(tempPassword, 12);
    const user = await prisma.user.create({
      data: { name, email, passwordHash, role: "guardian" },
    });
    userId = user.id;
  }

  const guardian = await prisma.guardian.create({
    data: {
      name,
      relation,
      phone,
      email: email || undefined,
      studentId,
      userId: userId || undefined,
    },
  });

  return { guardian, tempPassword: tempPassword ?? null };
}
