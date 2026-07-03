import { z } from "zod";

export const gradeSchema = z.object({
  studentId: z.string().min(1),
  subjectId: z.string().min(1),
  term: z.string().min(2),
  score: z.number().min(0).max(100),
  remarks: z.string().optional()
});
