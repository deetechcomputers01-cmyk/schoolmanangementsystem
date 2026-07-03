import { z } from "zod";

export const studentSchema = z.object({
  admissionNo: z.string().min(2),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  gender: z.string().min(1),
  dateOfBirth: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  address: z.string().min(3),
  photoUrl: z.string().startsWith("/").optional(),
  classId: z.string().min(1),
  guardian: z.object({
    name: z.string().min(2),
    phone: z.string().min(7),
    email: z.string().email().optional().or(z.literal("")),
    relation: z.string().min(2)
  })
});

export const studentUpdateSchema = studentSchema.partial();
