import { z } from "zod";

export const timetableSchema = z.object({
  classId:       z.string().min(1),
  subjectId:     z.string().min(1),
  day:           z.string().min(3),
  startsAt:      z.string().min(4),
  endsAt:        z.string().min(4),
  room:          z.string().min(1),
  recurrence:    z.enum(["weekly", "biweekly", "one_time"]).default("weekly"),
  effectiveDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  notes:         z.string().max(500).optional(),
});
