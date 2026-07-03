import { z } from "zod";

const VALID_ROLES = ["super_admin", "principal", "teacher", "staff", "student", "guardian"] as const;

export const updateRoleSchema = z.object({
  role: z.enum(VALID_ROLES)
});

export const toggleActiveSchema = z.object({
  isActive: z.boolean()
});

export const blockIPSchema = z.object({
  ip: z.string().ip({ version: "v4", message: "Must be a valid IPv4 address" }),
  reason: z.string().max(255).optional(),
  expiresAt: z.string().datetime().optional().transform((v) => (v ? new Date(v) : undefined))
});
