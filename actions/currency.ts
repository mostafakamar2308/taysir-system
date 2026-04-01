"use server";

import db from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getTokenFromCookie, verifyToken } from "@/lib/jwt";
import { Role } from "@/types/user";
import { z } from "zod";

const currencySchema = z.object({
  code: z.string().length(3, "يجب أن يكون الرمز 3 أحرف").toUpperCase(),
  name: z.string().min(1, "الاسم مطلوب"),
  symbol: z.string().min(1, "الرمز مطلوب"),
});

export async function createCurrency(data: z.infer<typeof currencySchema>) {
  const token = await getTokenFromCookie();
  if (!token) throw new Error("غير مصرح");
  const payload = verifyToken(token);
  if (!payload || payload.role !== Role.SuperAdmin) throw new Error("غير مصرح");

  const validated = currencySchema.parse(data);
  // Check if code already exists
  const existing = await db.currency.findUnique({
    where: { code: validated.code },
  });
  if (existing) throw new Error("الرمز موجود بالفعل");

  await db.currency.create({ data: validated });
  revalidatePath("/ar/dashboard/admin/currencies");
}

export async function updateCurrency(
  id: number,
  data: z.infer<typeof currencySchema>,
) {
  const token = await getTokenFromCookie();
  if (!token) throw new Error("غير مصرح");
  const payload = verifyToken(token);
  if (!payload || payload.role !== Role.SuperAdmin) throw new Error("غير مصرح");

  const validated = currencySchema.parse(data);
  // Check if code exists for another currency
  const existing = await db.currency.findFirst({
    where: { code: validated.code, NOT: { id } },
  });
  if (existing) throw new Error("الرمز موجود بالفعل");

  await db.currency.update({ where: { id }, data: validated });
  revalidatePath("/ar/dashboard/admin/currencies");
}

export async function deleteCurrency(id: number) {
  const token = await getTokenFromCookie();
  if (!token) throw new Error("غير مصرح");
  const payload = verifyToken(token);
  if (!payload || payload.role !== Role.SuperAdmin) throw new Error("غير مصرح");

  // Check if currency is used by any academy, student, tutor, etc.
  const used = await db.academy.count({ where: { defaultCurrencyId: id } });
  if (used > 0) throw new Error("لا يمكن حذف عملة مستخدمة من قبل أكاديميات");

  await db.currency.delete({ where: { id } });
  revalidatePath("/ar/dashboard/admin/currencies");
}
