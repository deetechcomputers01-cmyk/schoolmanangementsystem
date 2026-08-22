import bcrypt from "bcryptjs";
import { prisma } from "../prisma";
import { audit } from "./audit.service";

const OTP_LENGTH = 5;
const OTP_TTL_MINUTES = 10;
const MAX_ATTEMPTS = 5;
const MAX_REQUESTS_PER_WINDOW = 3;
const REQUEST_WINDOW_MINUTES = 15;

function generateOtp(): string {
  const digits = "0123456789";
  return Array.from({ length: OTP_LENGTH }, () => digits[Math.floor(Math.random() * digits.length)]).join("");
}

/**
 * Stands in for a real SMS provider. In dev/test this just logs the code
 * server-side; the caller (API route) decides whether to also echo it back
 * in the response based on NODE_ENV. Swapping in Twilio/Africa's Talking/etc
 * later only means replacing this one function.
 */
async function sendOtpSms(phone: string, code: string): Promise<void> {
  console.log(`[otp] would SMS ${phone}: your reset code is ${code}`);
}

export async function requestPasswordResetOtp(phone: string): Promise<{ devCode?: string }> {
  const user = await prisma.user.findUnique({ where: { phone } });

  // Don't reveal whether the phone is registered — always look like success.
  if (!user) {
    await audit(null, "otp_request_unknown_phone", "User", phone, { phone });
    return {};
  }

  const windowStart = new Date(Date.now() - REQUEST_WINDOW_MINUTES * 60 * 1000);
  const recentCount = await prisma.passwordResetOtp.count({
    where: { userId: user.id, createdAt: { gte: windowStart } },
  });
  if (recentCount >= MAX_REQUESTS_PER_WINDOW) {
    throw new Error("Too many requests. Please try again later.");
  }

  const code = generateOtp();
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

  await prisma.passwordResetOtp.create({
    data: { userId: user.id, codeHash, expiresAt },
  });
  await sendOtpSms(phone, code);
  await audit({ id: user.id, name: user.name, email: user.email, role: user.role }, "otp_requested", "User", user.id, {});

  return process.env.NODE_ENV !== "production" ? { devCode: code } : {};
}

export async function verifyPasswordResetOtp(phone: string, code: string): Promise<string> {
  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user) throw new Error("Invalid code.");

  const otp = await prisma.passwordResetOtp.findFirst({
    where: { userId: user.id, consumedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  if (!otp) throw new Error("Invalid or expired code.");
  if (otp.attempts >= MAX_ATTEMPTS) throw new Error("Too many attempts. Request a new code.");

  const valid = await bcrypt.compare(code, otp.codeHash);
  if (!valid) {
    await prisma.passwordResetOtp.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } });
    throw new Error("Invalid or expired code.");
  }

  await prisma.passwordResetOtp.update({ where: { id: otp.id }, data: { consumedAt: new Date() } });
  await audit({ id: user.id, name: user.name, email: user.email, role: user.role }, "otp_verified", "User", user.id, {});
  return user.id;
}

export async function resetPasswordWithToken(userId: string, newPassword: string): Promise<void> {
  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash, passwordChangedAt: new Date() },
  });
  await audit(null, "password_reset_via_otp", "User", userId, {});
}
