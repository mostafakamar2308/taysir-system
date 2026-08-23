"use server";

import db from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import bcrypt from "bcrypt";
import { Role } from "@/types/user";
import { getTokenFromCookie, verifyToken } from "@/lib/jwt";
import { withResult, fail } from "@/lib/action-result";

const supervisorSchema = z.object({
  name: z.string().min(1, "الاسم مطلوب"),
  email: z.string().email("بريد إلكتروني غير صالح"),
  phone: z.string().optional().nullable(),
  timezone: z.string().min(1, "المنطقة الزمنية مطلوبة"),
});

const createSupervisorSchema = supervisorSchema.extend({
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
});

export const createSupervisor = withResult(async (formData: FormData) => {
  const token = await getTokenFromCookie();
  if (!token) return fail("غير مصرح");
  const payload = verifyToken(token);
  if (!payload || !payload.academyId) return fail("غير مصرح");

  const rawData = {
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") || null,
    timezone: formData.get("timezone") || "Africa/Cairo",
    password: formData.get("password"),
  };

  const validated = createSupervisorSchema.safeParse(rawData);
  if (!validated.success) {
    return fail(validated.error.issues[0]?.message ?? "بيانات غير صحيحة");
  }

  const existing = await db.user.findUnique({
    where: { email: validated.data.email },
  });
  if (existing) return fail("البريد الإلكتروني مستخدم بالفعل");

  const hashedPassword = await bcrypt.hash(validated.data.password, 10);
  await db.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: validated.data.email,
        password: hashedPassword,
        phone: validated.data.phone,
        name: validated.data.name,
        role: Role.Supervisor,
        timezone: validated.data.timezone,
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
});

export const updateSupervisor = withResult(
  async (id: number, formData: FormData) => {
    const token = await getTokenFromCookie();
    if (!token) return fail("غير مصرح");
    const payload = verifyToken(token);
    if (!payload || !payload.academyId) return fail("غير مصرح");

    const rawData = {
      name: formData.get("name"),
      email: formData.get("email"),
      phone: formData.get("phone") || null,
      timezone: formData.get("timezone") || "Africa/Cairo",
    };

    const validated = supervisorSchema.safeParse(rawData);
    if (!validated.success) {
      return fail(validated.error.issues[0]?.message ?? "بيانات غير صحيحة");
    }

    const supervisor = await db.supervisor.findUnique({
      where: { id },
      select: { userId: true, academyId: true },
    });
    if (!supervisor) return fail("المشرف غير موجود");
    if (supervisor.academyId !== payload.academyId) return fail("غير مصرح");

    const existing = await db.user.findFirst({
      where: { email: validated.data.email, NOT: { id: supervisor.userId } },
    });
    if (existing) return fail("البريد الإلكتروني مستخدم بالفعل");

    await db.user.update({
      where: { id: supervisor.userId },
      data: {
        name: validated.data.name,
        email: validated.data.email,
        phone: validated.data.phone,
        timezone: validated.data.timezone,
      },
    });

    revalidatePath("/ar/dashboard/supervisors");
  },
);

export const toggleSupervisorActive = withResult(async (id: number) => {
  const token = await getTokenFromCookie();
  if (!token) return fail("غير مصرح");
  const payload = verifyToken(token);
  if (!payload || !payload.academyId) return fail("غير مصرح");

  const supervisor = await db.supervisor.findUnique({
    where: { id },
    select: { id: true, academyId: true, active: true },
  });
  if (!supervisor) return fail("المشرف غير موجود");
  if (supervisor.academyId !== payload.academyId) return fail("غير مصرح");

  await db.supervisor.update({
    where: { id },
    data: { active: !supervisor.active },
  });

  revalidatePath("/ar/dashboard/supervisors");
});

export const assignTutors = withResult(
  async (supervisorId: number, tutorIds: number[]) => {
    const token = await getTokenFromCookie();
    if (!token) return fail("غير مصرح");
    const payload = verifyToken(token);
    if (!payload || !payload.academyId) return fail("غير مصرح");

    const supervisor = await db.supervisor.findUnique({
      where: { id: supervisorId },
      select: { id: true, academyId: true },
    });
    if (!supervisor) return fail("المشرف غير موجود");
    if (supervisor.academyId !== payload.academyId) return fail("غير مصرح");

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
  },
);
