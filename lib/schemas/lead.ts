import { z } from "zod";

export const leadSchema = z.object({
  fullName: z.string().min(2, "الاسم مطلوب"),
  countryCode: z.string().min(1, "اختر الدولة"),
  phoneNumber: z.string().min(7, "رقم الهاتف مطلوب"),
  academyName: z.string().min(2, "اسم الأكاديمية مطلوب"),
  studentCategory: z.enum(["foreign", "expats", "gulf", "egypt"]),
  teacherCount: z.enum(["1-5", "6-15", "16-30", "30+"]),
  currentMethod: z.enum([
    "excel-whatsapp",
    "separate-tools",
    "other-software",
    "none",
  ]),
  biggestChallenge: z.enum([
    "student-leakage",
    "financial-chaos",
    "schedule-chaos",
    "professional-appearance",
  ]),
  urgency: z.enum(["asap", "within-month", "exploring"]),
});

export type LeadData = z.infer<typeof leadSchema>;
