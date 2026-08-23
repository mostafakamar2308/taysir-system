"use server";

import db from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import bcrypt from "bcrypt";
import { Role } from "@/types/user";
import { getTokenFromCookie, verifyToken } from "@/lib/jwt";
import { withResult, fail } from "@/lib/action-result";

const createUserSchema = z.object({
  name: z.string().min(1, "الاسم مطلوب"),
  email: z.string().email("بريد إلكتروني غير صالح"),
  password: z.string().min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل"),
  role: z.number().min(2).max(3), // Supervisor(2) or Tutor(3)
  academyId: z.number(),
  currencyId: z.number(),
});

const updateUserSchema = z.object({
  name: z.string().min(1, "الاسم مطلوب"),
  email: z.string().email("بريد إلكتروني غير صالح"),
  role: z.number().min(2).max(3),
});

export const createUser = withResult(async (formData: FormData) => {
  const token = await getTokenFromCookie();
  if (!token) return fail("غير مصرح");
  const payload = verifyToken(token);
  if (!payload) return fail("غير مصرح");
  if (payload.role !== 1) return fail("غير مصرح"); // Only academy admin can add users

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const role = parseInt(formData.get("role") as string);
  const currencyId = parseInt(formData.get("role") as string);
  const academyId = payload.academyId!; // from the admin's token

  const validated = createUserSchema.safeParse({
    name,
    email,
    password,
    role,
    academyId,
    currencyId,
  });
  if (!validated.success) {
    return fail(validated.error.issues[0]?.message ?? "بيانات غير صحيحة");
  }

  // Check if user already exists
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) return fail("البريد الإلكتروني مستخدم بالفعل");

  const hashedPassword = await bcrypt.hash(validated.data.password, 10);

  const user = await db.user.create({
    data: {
      email: validated.data.email,
      password: hashedPassword,
      name: validated.data.name,
      role: validated.data.role,
      timezone: "Africa/Cairo",
    },
  });

  // Create the corresponding role record
  if (validated.data.role === Role.Supervisor) {
    await db.supervisor.create({
      data: {
        userId: user.id,
        academyId: validated.data.academyId,
      },
    });
  } else if (validated.data.role === Role.Tutor) {
    await db.tutor.create({
      data: {
        userId: user.id,
        academyId: validated.data.academyId,
        baseHourlyRate: 50,
        baseGroupHourlyRate: 50,
        active: true,
        currencyId: validated.data.currencyId,
      },
    });
  }

  revalidatePath("/ar/dashboard/settings/users");
  return { success: true };
});

export const updateUser = withResult(
  async (userId: number, formData: FormData) => {
    const token = await getTokenFromCookie();
    if (!token) return fail("غير مصرح");
    const payload = verifyToken(token);
    if (!payload) return fail("غير مصرح");
    if (payload.role !== 1) return fail("غير مصرح"); // Only academy admin

    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const role = parseInt(formData.get("role") as string);

    const validated = updateUserSchema.safeParse({ name, email, role });
    if (!validated.success) {
      return fail(validated.error.issues[0]?.message ?? "بيانات غير صحيحة");
    }

    // Check email uniqueness if changed
    const existing = await db.user.findFirst({
      where: { email: validated.data.email, NOT: { id: userId } },
    });
    if (existing) return fail("البريد الإلكتروني مستخدم بالفعل");

    await db.user.update({
      where: { id: userId },
      data: {
        name: validated.data.name,
        email: validated.data.email,
        role: validated.data.role,
      },
    });

    // Update role-specific records if needed (e.g., if role changed, but for simplicity we skip)
    revalidatePath("/ar/dashboard/settings/users");
    return { success: true };
  },
);

export const toggleUserActive = withResult(async (userId: number) => {
  const token = await getTokenFromCookie();
  if (!token) return fail("غير مصرح");
  const payload = verifyToken(token);
  if (!payload) return fail("غير مصرح");
  if (payload.role !== 1) return fail("غير مصرح");

  const user = await db.user.findUnique({
    where: { id: userId },
    include: { tutor: true, supervisor: true },
  });
  if (!user) return fail("المستخدم غير موجود");

  if (user.tutor) {
    await db.tutor.update({
      where: { userId },
      data: { active: !user.tutor.active },
    });
  } else if (user.supervisor) {
    await db.supervisor.update({
      where: { userId },
      data: { active: !user.supervisor.active },
    });
  }

  revalidatePath("/ar/dashboard/settings/users");
  return { success: true };
});

export const resetPassword = withResult(async (userId: number) => {
  const token = await getTokenFromCookie();
  if (!token) return fail("غير مصرح");
  const payload = verifyToken(token);
  if (!payload) return fail("غير مصرح");
  if (payload.role !== 1) return fail("غير مصرح");

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return fail("المستخدم غير موجود");

  const tempPassword = "Pass@123";
  const hashed = await bcrypt.hash(tempPassword, 10);

  await db.user.update({
    where: { id: userId },
    data: { password: hashed },
  });

  // In a real app, you would send an email with the new password
  // Here we just return it (for demo, you'd normally not return it)
  return { tempPassword };
});
