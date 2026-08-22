import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  rememberDevice: z.boolean().optional().default(false)
});

export const otpRequestSchema = z.object({
  phone: z.string().min(6),
});

export const otpVerifySchema = z.object({
  phone: z.string().min(6),
  code: z.string().length(5),
});

export const otpResetSchema = z.object({
  newPassword: z.string().min(8),
});
