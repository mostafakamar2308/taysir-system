"use server";

import db from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import bcrypt from "bcrypt";
import { Role } from "@/types/user";

const createTutorSchema = z.object({
  name: z.string().min(1, "الاسم مطلوب"),
  email: z.string().email("بريد إلكتروني غير صالح"),
  phone: z.string().min(1, "رقم الهاتف مطلوب"),
  timezone: z.string().min(1, "المنطقة الزمنية مطلوبة"),
  pricePerSession: z.number().min(0, "السعر يجب أن يكون 0 أو أكثر"),
  specialities: z.array(z.number()).optional(),
  active: z.boolean().default(true),
  bio: z.string().optional().nullable(),
  qualifications: z.string().optional().nullable(),
  maxStudents: z.number().optional().nullable(),
  zoomAuthenticated: z.boolean().default(false),
  currencyId: z.number(),
  academyId: z.number(),
});

export async function createTutor(formData: FormData) {
  // Parse specialities from multiselect (sent as comma-separated values)
  const specialitiesStr = formData.get("specialities") as string;
  const specialities = specialitiesStr
    ? specialitiesStr.split(",").map(Number)
    : [];

  const rawData = {
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    timezone: formData.get("timezone"),
    pricePerSession: formData.get("pricePerSession")
      ? parseFloat(formData.get("pricePerSession") as string)
      : undefined,
    specialities,
    active: formData.get("active") === "true",
    bio: formData.get("bio") || null,
    qualifications: formData.get("qualifications") || null,
    maxStudents: formData.get("maxStudents")
      ? parseInt(formData.get("maxStudents") as string)
      : null,
    currencyId: parseInt(formData.get("currencyId") as string),
    zoomAuthenticated: formData.get("zoomAuthenticated") === "true",
    academyId: parseInt(formData.get("academyId") as string),
  };

  const validated = createTutorSchema.parse(rawData);

  const academy = await db.academy.findUnique({
    where: { id: validated.academyId },
  });
  if (!academy) {
    throw new Error("Academy not found");
  }

  // Create user first
  const hashedPassword = await bcrypt.hash("default123", 10); // You should generate a random password or let the user set it
  const user = await db.user.create({
    data: {
      email: validated.email,
      password: hashedPassword,
      name: validated.name,
      role: Role.Tutor,
      timezone: validated.timezone,
    },
  });

  await db.tutor.create({
    data: {
      userId: user.id,
      academyId: validated.academyId,
      pricePerSession: validated.pricePerSession,
      active: validated.active,
      bio: validated.bio,
      qualifications: validated.qualifications,
      maxStudents: validated.maxStudents,
      zoomAuthenticated: validated.zoomAuthenticated,
      currencyId: validated.currencyId,
      specialities: {
        connect: validated.specialities?.map((id) => ({ id })),
      },
    },
  });

  revalidatePath("/dashboard/tutors");
}
