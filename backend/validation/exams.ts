import { z } from "zod";

export const createExamSchema = z.object({
  title:       z.string().min(1).max(120),
  subjectId:   z.string().cuid(),
  classId:     z.string().cuid(),
  termId:      z.string().cuid().optional(),
  scheduledAt: z.string().datetime(),
  maxScore:    z.number().positive().max(1000).default(100)
});

export const scoreEntrySchema = z.object({
  scores: z.array(
    z.object({
      studentId: z.string().cuid(),
      score:     z.number().min(0).max(10000),
      remarks:   z.string().max(255).optional()
    })
  ).min(1)
});
