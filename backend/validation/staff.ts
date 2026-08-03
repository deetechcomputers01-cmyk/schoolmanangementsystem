import { z } from "zod";

const STAFF_CATEGORIES = ["teaching", "accounts", "driver", "caterer", "nurse", "security", "admin"] as const;

export const staffSchema = z.object({
  staffNo:       z.string().min(2),
  firstName:     z.string().min(2),
  lastName:      z.string().min(2),
  phone:         z.string().min(7),
  roleTitle:     z.string().min(2),
  email:         z.string().email().optional().or(z.literal("")),
  photoUrl:      z.string().startsWith("/").optional(),
  documents:     z.array(z.object({
    name: z.string().min(1),
    url: z.string().startsWith("/"),
    type: z.string().min(1),
    size: z.number().nonnegative(),
  })).optional(),
  staffCategory: z.enum(STAFF_CATEGORIES).default("teaching"),
  isTeaching:    z.boolean().optional(),
  notes:         z.string().optional(),
});

export type StaffCategory = typeof STAFF_CATEGORIES[number];
export const STAFF_CATEGORY_LABELS: Record<StaffCategory, string> = {
  teaching:  "Teaching",
  accounts:  "Accounts",
  driver:    "Driver",
  caterer:   "Caterer",
  nurse:     "Nurse",
  security:  "Security",
  admin:     "Admin",
};
