"use server";

import db from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import bcrypt from "bcrypt";
import { getTokenFromCookie, verifyToken } from "@/lib/jwt";
import { withResult, fail } from "@/lib/action-result";

const profileSchema = z.object({
  name: z.string().min(1, "الاسم مطلوب"),
  phone: z.string().optional().nullable(),
  timezone: z.string().min(1, "المنطقة الزمنية مطلوبة"),
  preferredLanguage: z.string().min(1, "اللغة مطلوبة"),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "كلمة المرور الحالية مطلوبة"),
  newPassword: z
    .string()
    .min(8, "كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل"),
});

export const updateProfile = withResult(async (formData: FormData) => {
  const token = await getTokenFromCookie();
  if (!token) return fail("غير مصرح");
  const payload = verifyToken(token);
  if (!payload) return fail("غير مصرح");

  const name = formData.get("name") as string;
  const phone = (formData.get("phone") as string) || null;
  const timezone = formData.get("timezone") as string;
  const preferredLanguage = formData.get("preferredLanguage") as string;

  const validated = profileSchema.safeParse({
    name,
    phone,
    timezone,
    preferredLanguage,
  });
  if (!validated.success) {
    return fail(validated.error.issues[0]?.message ?? "بيانات غير صحيحة");
  }

  await db.user.update({
    where: { id: payload.id },
    data: validated.data,
  });

  revalidatePath("/ar/dashboard/settings/personal");
  return { success: true };
});

export const changePassword = withResult(async (formData: FormData) => {
  const token = await getTokenFromCookie();
  if (!token) return fail("غير مصرح");
  const payload = verifyToken(token);
  if (!payload) return fail("غير مصرح");

  const currentPassword = formData.get("currentPassword") as string;
  const newPassword = formData.get("newPassword") as string;

  const validated = passwordSchema.safeParse({ currentPassword, newPassword });
  if (!validated.success) {
    return fail(validated.error.issues[0]?.message ?? "بيانات غير صحيحة");
  }

  const user = await db.user.findUnique({
    where: { id: payload.id },
  });
  if (!user) return fail("المستخدم غير موجود");

  const valid = await bcrypt.compare(validated.data.currentPassword, user.password);
  if (!valid) return fail("كلمة المرور الحالية غير صحيحة");

  const hashedPassword = await bcrypt.hash(validated.data.newPassword, 10);

  await db.user.update({
    where: { id: payload.id },
    data: { password: hashedPassword },
  });

  revalidatePath("/ar/dashboard/settings/security");
  return { success: true };
});
