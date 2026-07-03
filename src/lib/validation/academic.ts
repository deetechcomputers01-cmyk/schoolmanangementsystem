import { z } from "zod";

export const academicYearSchema = z.object({
  name:      z.string().min(1).max(20),
  startDate: z.string().datetime(),
  endDate:   z.string().datetime()
}).refine((d) => new Date(d.endDate) > new Date(d.startDate), {
  message: "End date must be after start date",
  path: ["endDate"]
});

export const termSchema = z.object({
  name:           z.string().min(1).max(50),
  academicYearId: z.string().cuid(),
  startDate:      z.string().datetime(),
  endDate:        z.string().datetime()
}).refine((d) => new Date(d.endDate) > new Date(d.startDate), {
  message: "End date must be after start date",
  path: ["endDate"]
});

export const updateTermSchema = z.object({
  name:      z.string().min(1).max(50).optional(),
  startDate: z.string().datetime().optional(),
  endDate:   z.string().datetime().optional()
});
