import { z } from "zod";

export const attendanceSchema = z.object({
  classId: z.string().min(1),
  date: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  records: z.array(
    z.object({
      studentId: z.string().min(1),
      status: z.enum(["present", "absent", "late", "excused"]),
      note: z.string().optional()
    })
  ).min(1)
});
