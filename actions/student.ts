"use server";

import db from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const createStudentSchema = z.object({
  name: z.string().min(1, "الاسم مطلوب"),
  email: z.string().email("بريد إلكتروني غير صالح").optional().nullable(),
  age: z.number().min(1, "العمر مطلوب"),
  phone: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  timezone: z.string().min(1, "المنطقة الزمنية مطلوبة"),
  status: z.number().default(0),
  startDate: z.date().optional(),
  renewalDate: z.date().optional().nullable(),
  source: z.string().optional().nullable(),
  currentProgram: z.string().optional().nullable(),
  emergencyContactName: z.string().optional().nullable(),
  emergencyContactPhone: z.string().optional().nullable(),
  preferredLanguage: z.string().optional().nullable(),
  tutorId: z.number().optional().nullable(),
  planId: z.number().optional().nullable(),
  academyId: z.number(),
});

export async function createStudent(formData: FormData) {
  // Parse form data
  const rawData = {
    name: formData.get("name"),
    email: formData.get("email") || null,
    age: formData.get("age")
      ? parseInt(formData.get("age") as string)
      : undefined,
    phone: formData.get("phone") || null,
    country: formData.get("country") || null,
    timezone: formData.get("timezone"),
    status: formData.get("status")
      ? parseInt(formData.get("status") as string)
      : 0,
    startDate: formData.get("startDate")
      ? new Date(formData.get("startDate") as string)
      : new Date(),
    renewalDate: formData.get("renewalDate")
      ? new Date(formData.get("renewalDate") as string)
      : null,
    source: formData.get("source") || null,
    currentProgram: formData.get("currentProgram") || null,
    emergencyContactName: formData.get("emergencyContactName") || null,
    emergencyContactPhone: formData.get("emergencyContactPhone") || null,
    preferredLanguage: formData.get("preferredLanguage") || null,
    tutorId: formData.get("tutorId")
      ? parseInt(formData.get("tutorId") as string)
      : null,
    planId: formData.get("planId")
      ? parseInt(formData.get("planId") as string)
      : null,
    academyId: parseInt(formData.get("academyId") as string),
  };

  const validated = createStudentSchema.parse(rawData);

  await db.student.create({
    data: validated,
  });

  revalidatePath("/dashboard/students");
}
