import { z } from "zod";

export const healthRecordSchema = z.object({
  bloodGroup: z.string().max(10).optional(),
  allergies: z.string().max(1000).optional(),
  conditions: z.string().max(1000).optional(),
  emergencyContact: z.string().max(200).optional(),
  emergencyPhone: z.string().max(30).optional(),
});

export const sickVisitSchema = z.object({
  complaint: z.string().min(1).max(1000),
  treatment: z.string().max(1000).optional(),
  notes: z.string().max(2000).optional(),
  date: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  status: z.enum(["waiting", "in_consultation", "medication_due", "completed"]).optional(),
  triage: z.enum(["routine", "urgent", "emergency", "scheduled"]).optional(),
  vitalsTemp: z.string().max(20).optional(),
  vitalsBp: z.string().max(20).optional(),
});

export const sickVisitUpdateSchema = sickVisitSchema.partial();

export const vaccinationSchema = z.object({
  vaccineName: z.string().min(1).max(200),
  date: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  nextDue: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  notes: z.string().max(1000).optional(),
});
