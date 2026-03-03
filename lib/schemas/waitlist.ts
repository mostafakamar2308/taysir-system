import { z } from "zod";

export const waitlistSchema = z.object({
  fullName: z.string().trim().min(1).max(100),
  email: z.string().trim().min(1).email(),
  phone: z
    .string()
    .trim()
    .min(1)
    .regex(/^[\d\s\+\-\(\)]+$/),
  academyName: z.string().trim().min(1),
  academySize: z.string().optional(),
  currentMethod: z.string().optional(),
  reviewBonus: z.boolean().optional(),
  videoBonus: z.boolean().optional(),
  terms: z.boolean().refine((val) => val === true, {
    message: "Terms must be accepted",
  }),
});

export type WaitlistData = z.infer<typeof waitlistSchema>;
