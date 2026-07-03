import { z } from "zod";

export const updateSettingsSchema = z.object({
  name:         z.string().min(1).max(200).optional(),
  address:      z.string().max(500).optional(),
  motto:        z.string().max(300).optional(),
  phone:        z.string().max(30).optional(),
  email:        z.string().email().optional().or(z.literal("")),
  logoUrl:      z.string().url().optional().or(z.literal("")),
  reportFooter: z.string().max(500).optional(),
  timezone:     z.string().max(60).optional()
});
