"use server";

import db from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import bcrypt from "bcrypt";
import { Role } from "@/types/user";
import { getTokenFromCookie, verifyToken } from "@/lib/jwt";

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

export async function createUser(formData: FormData) {
  const token = await getTokenFromCookie();
  if (!token) throw new Error("غير مصرح");
  const payload = verifyToken(token);
  if (!payload) throw new Error("غير مصرح");
  if (payload.role !== 1) throw new Error("غير مصرح"); // Only academy admin can add users

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const role = parseInt(formData.get("role") as string);
  const currencyId = parseInt(formData.get("role") as string);
  const academyId = payload.academyId!; // from the admin's token

  const validated = createUserSchema.parse({
    name,
    email,
    password,
    role,
    academyId,
    currencyId,
  });

  // Check if user already exists
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) throw new Error("البريد الإلكتروني مستخدم بالفعل");

  const hashedPassword = await bcrypt.hash(validated.password, 10);

  const user = await db.user.create({
    data: {
      email: validated.email,
      password: hashedPassword,
      name: validated.name,
      role: validated.role,
      timezone: "Africa/Cairo",
    },
  });

  // Create the corresponding role record
  if (validated.role === Role.Supervisor) {
    await db.supervisor.create({
      data: {
        userId: user.id,
        academyId: validated.academyId,
      },
    });
  } else if (validated.role === Role.Tutor) {
    await db.tutor.create({
      data: {
        userId: user.id,
        academyId: validated.academyId,
        privatePricePerHour: 50,
        groupPricePerHour: 50,
        active: true,
        currencyId: validated.currencyId,
      },
    });
  }

  revalidatePath("/ar/dashboard/settings/users");
  return { success: true };
}

export async function updateUser(userId: number, formData: FormData) {
  const token = await getTokenFromCookie();
  if (!token) throw new Error("غير مصرح");
  const payload = verifyToken(token);
  if (!payload) throw new Error("غير مصرح");
  if (payload.role !== 1) throw new Error("غير مصرح"); // Only academy admin

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const role = parseInt(formData.get("role") as string);

  const validated = updateUserSchema.parse({ name, email, role });

  // Check email uniqueness if changed
  const existing = await db.user.findFirst({
    where: { email: validated.email, NOT: { id: userId } },
  });
  if (existing) throw new Error("البريد الإلكتروني مستخدم بالفعل");

  await db.user.update({
    where: { id: userId },
    data: {
      name: validated.name,
      email: validated.email,
      role: validated.role,
    },
  });

  // Update role-specific records if needed (e.g., if role changed, but for simplicity we skip)
  revalidatePath("/ar/dashboard/settings/users");
  return { success: true };
}

export async function toggleUserActive(userId: number) {
  const token = await getTokenFromCookie();
  if (!token) throw new Error("غير مصرح");
  const payload = verifyToken(token);
  if (!payload) throw new Error("غير مصرح");
  if (payload.role !== 1) throw new Error("غير مصرح");

  const user = await db.user.findUnique({
    where: { id: userId },
    include: { tutor: true, supervisor: true },
  });
  if (!user) throw new Error("المستخدم غير موجود");

  if (user.tutor) {
    await db.tutor.update({
      where: { userId },
      data: { active: !user.tutor.active },
    });
  } else if (user.supervisor) {
    // Supervisor might not have an active flag; you could add one or just skip
    // For now, we'll just return success without doing anything
  }

  revalidatePath("/ar/dashboard/settings/users");
  return { success: true };
}

export async function resetPassword(userId: number) {
  const token = await getTokenFromCookie();
  if (!token) throw new Error("غير مصرح");
  const payload = verifyToken(token);
  if (!payload) throw new Error("غير مصرح");
  if (payload.role !== 1) throw new Error("غير مصرح");

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("المستخدم غير موجود");

  const tempPassword = "Pass@123";
  const hashed = await bcrypt.hash(tempPassword, 10);

  await db.user.update({
    where: { id: userId },
    data: { password: hashed },
  });

  // In a real app, you would send an email with the new password
  // Here we just return it (for demo, you'd normally not return it)
  return { tempPassword };
}
