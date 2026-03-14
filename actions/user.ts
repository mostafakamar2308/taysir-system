"use server";

import db from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import bcrypt from "bcrypt";
import { getTokenFromCookie, verifyToken } from "@/lib/jwt";

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

export async function updateProfile(formData: FormData) {
  const token = await getTokenFromCookie();
  if (!token) throw new Error("غير مصرح");
  const payload = verifyToken(token);
  if (!payload) throw new Error("غير مصرح");

  const name = formData.get("name") as string;
  const phone = (formData.get("phone") as string) || null;
  const timezone = formData.get("timezone") as string;
  const preferredLanguage = formData.get("preferredLanguage") as string;

  const validated = profileSchema.parse({
    name,
    phone,
    timezone,
    preferredLanguage,
  });

  await db.user.update({
    where: { id: payload.id },
    data: validated,
  });

  revalidatePath("/ar/dashboard/settings/personal");
  return { success: true };
}

export async function changePassword(formData: FormData) {
  const token = await getTokenFromCookie();
  if (!token) throw new Error("غير مصرح");
  const payload = verifyToken(token);
  if (!payload) throw new Error("غير مصرح");

  const currentPassword = formData.get("currentPassword") as string;
  const newPassword = formData.get("newPassword") as string;

  const validated = passwordSchema.parse({ currentPassword, newPassword });

  const user = await db.user.findUnique({
    where: { id: payload.id },
  });
  if (!user) throw new Error("المستخدم غير موجود");

  const valid = await bcrypt.compare(validated.currentPassword, user.password);
  if (!valid) throw new Error("كلمة المرور الحالية غير صحيحة");

  const hashedPassword = await bcrypt.hash(validated.newPassword, 10);

  await db.user.update({
    where: { id: payload.id },
    data: { password: hashedPassword },
  });

  revalidatePath("/ar/dashboard/settings/security");
  return { success: true };
}
