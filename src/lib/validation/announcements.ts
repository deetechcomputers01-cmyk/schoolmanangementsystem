import { z } from "zod";

const VALID_ROLES = ["super_admin", "principal", "teacher", "staff", "student", "guardian"] as const;

export const createAnnouncementSchema = z.object({
  title:     z.string().min(1).max(200),
  body:      z.string().min(1).max(5000),
  audience:  z.array(z.enum(VALID_ROLES)).default([]),
  isPinned:  z.boolean().default(false),
  expiresAt: z.string().datetime().optional().transform((v) => v ? new Date(v) : undefined)
});

export const updateAnnouncementSchema = z.object({
  title:     z.string().min(1).max(200).optional(),
  body:      z.string().min(1).max(5000).optional(),
  audience:  z.array(z.enum(VALID_ROLES)).optional(),
  isPinned:  z.boolean().optional(),
  expiresAt: z.string().datetime().nullable().optional()
    .transform((v) => v ? new Date(v) : null)
});
