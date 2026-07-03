import { z } from "zod";

export const staffSchema = z.object({
  staffNo: z.string().min(2),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  phone: z.string().min(7),
  roleTitle: z.string().min(2),
  email: z.string().email().optional().or(z.literal(""))
});
