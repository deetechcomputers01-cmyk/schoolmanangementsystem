import { z } from "zod";

export const feeSchema = z.object({
  studentId: z.string().min(1),
  term: z.string().min(2),
  description: z.string().min(2),
  amountDue: z.number().positive()
});

export const paymentSchema = z.object({
  feeRecordId: z.string().min(1),
  amount: z.number().positive(),
  method: z.enum(["cash", "mobile_money", "bank_transfer", "card"]),
  reference: z.string().min(2)
});
