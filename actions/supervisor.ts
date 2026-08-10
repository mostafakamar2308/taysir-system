"use server";

import db from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import bcrypt from "bcrypt";
import { Role } from "@/types/user";
import { getTokenFromCookie, verifyToken } from "@/lib/jwt";

const supervisorSchema = z.object({
  name: z.string().min(1, "الاسم مطلوب"),
  email: z.string().email("بريد إلكتروني غير صالح"),
  phone: z.string().optional().nullable(),
  timezone: z.string().min(1, "المنطقة الزمنية مطلوبة"),
});

export async function createSupervisor(formData: FormData) {
  const token = await getTokenFromCookie();
  if (!token) throw new Error("غير مصرح");
  const payload = verifyToken(token);
  if (!payload || !payload.academyId) throw new Error("غير مصرح");

  const rawData = {
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") || null,
    timezone: formData.get("timezone") || "Africa/Cairo",
  };

  const validated = supervisorSchema.parse(rawData);

  const existing = await db.user.findUnique({
    where: { email: validated.email },
  });
  if (existing) throw new Error("البريد الإلكتروني مستخدم بالفعل");

  const hashedPassword = await bcrypt.hash("24689110134", 10);
  await db.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: validated.email,
        password: hashedPassword,
        phone: validated.phone,
        name: validated.name,
        role: Role.Supervisor,
        timezone: validated.timezone,
      },
    });
    await tx.supervisor.create({
      data: {
        userId: user.id,
        academyId: payload.academyId!,
        active: true,
      },
    });
  });

  revalidatePath("/ar/dashboard/supervisors");
}

export async function updateSupervisor(id: number, formData: FormData) {
  const token = await getTokenFromCookie();
  if (!token) throw new Error("غير مصرح");
  const payload = verifyToken(token);
  if (!payload || !payload.academyId) throw new Error("غير مصرح");

  const rawData = {
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") || null,
    timezone: formData.get("timezone") || "Africa/Cairo",
  };

  const validated = supervisorSchema.parse(rawData);

  const supervisor = await db.supervisor.findUnique({
    where: { id },
    select: { userId: true, academyId: true },
  });
  if (!supervisor) throw new Error("المشرف غير موجود");
  if (supervisor.academyId !== payload.academyId) throw new Error("غير مصرح");

  const existing = await db.user.findFirst({
    where: { email: validated.email, NOT: { id: supervisor.userId } },
  });
  if (existing) throw new Error("البريد الإلكتروني مستخدم بالفعل");

  await db.user.update({
    where: { id: supervisor.userId },
    data: {
      name: validated.name,
      email: validated.email,
      phone: validated.phone,
      timezone: validated.timezone,
    },
  });

  revalidatePath("/ar/dashboard/supervisors");
}

export async function toggleSupervisorActive(id: number) {
  const token = await getTokenFromCookie();
  if (!token) throw new Error("غير مصرح");
  const payload = verifyToken(token);
  if (!payload || !payload.academyId) throw new Error("غير مصرح");

  const supervisor = await db.supervisor.findUnique({
    where: { id },
    select: { id: true, academyId: true, active: true },
  });
  if (!supervisor) throw new Error("المشرف غير موجود");
  if (supervisor.academyId !== payload.academyId) throw new Error("غير مصرح");

  await db.supervisor.update({
    where: { id },
    data: { active: !supervisor.active },
  });

  revalidatePath("/ar/dashboard/supervisors");
}

export async function assignTutors(supervisorId: number, tutorIds: number[]) {
  const token = await getTokenFromCookie();
  if (!token) throw new Error("غير مصرح");
  const payload = verifyToken(token);
  if (!payload || !payload.academyId) throw new Error("غير مصرح");

  const supervisor = await db.supervisor.findUnique({
    where: { id: supervisorId },
    select: { id: true, academyId: true },
  });
  if (!supervisor) throw new Error("المشرف غير موجود");
  if (supervisor.academyId !== payload.academyId) throw new Error("غير مصرح");

  const tutorIdsSet = new Set(tutorIds);

  await db.$transaction(async (tx) => {
    await tx.tutor.updateMany({
      where: { defaultSupervisorId: supervisorId },
      data: { defaultSupervisorId: null },
    });

    if (tutorIdsSet.size > 0) {
      await tx.tutor.updateMany({
        where: {
          id: { in: Array.from(tutorIdsSet) },
          academyId: payload.academyId!,
        },
        data: { defaultSupervisorId: supervisorId },
      });
    }
  });

  revalidatePath("/ar/dashboard/supervisors");
}
