"use server";

import db from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getTokenFromCookie, verifyToken } from "@/lib/jwt";

const currencySchema = z.object({
  code: z.string().length(3, "الرمز يجب أن يكون 3 أحرف").toUpperCase(),
  name: z.string().min(1, "الاسم مطلوب"),
  symbol: z.string().min(1, "الرمز مطلوب"),
  exchangeRate: z.number().positive("سعر الصرف يجب أن يكون أكبر من 0"),
  isDefault: z.boolean().default(false),
});

export async function createCurrency(formData: FormData) {
  const token = await getTokenFromCookie();
  if (!token) throw new Error("غير مصرح");
  const payload = verifyToken(token);
  if (!payload || payload.role !== 1) throw new Error("غير مصرح"); // only academy admin
  const academyId = payload.academyId!;

  const rawData = {
    code: formData.get("code"),
    name: formData.get("name"),
    symbol: formData.get("symbol"),
    exchangeRate: parseFloat(formData.get("exchangeRate") as string),
    isDefault: formData.get("isDefault") === "true",
  };
  const validated = currencySchema.parse(rawData);

  // If setting as default, unset any existing default for this academy
  if (validated.isDefault) {
    await db.currency.updateMany({
      where: { academyId, isDefault: true },
      data: { isDefault: false },
    });
  }

  await db.currency.create({
    data: {
      ...validated,
      academyId,
    },
  });

  revalidatePath("/dashboard/settings/currencies");
}

export async function updateCurrency(id: number, formData: FormData) {
  const token = await getTokenFromCookie();
  if (!token) throw new Error("غير مصرح");
  const payload = verifyToken(token);
  if (!payload || payload.role !== 1) throw new Error("غير مصرح");
  const academyId = payload.academyId!;

  const rawData = {
    code: formData.get("code"),
    name: formData.get("name"),
    symbol: formData.get("symbol"),
    exchangeRate: parseFloat(formData.get("exchangeRate") as string),
    isDefault: formData.get("isDefault") === "true",
  };
  const validated = currencySchema.parse(rawData);

  // If setting as default, unset any other default
  if (validated.isDefault) {
    await db.currency.updateMany({
      where: { academyId, isDefault: true, NOT: { id } },
      data: { isDefault: false },
    });
  }

  await db.currency.update({
    where: { id, academyId },
    data: validated,
  });

  revalidatePath("/dashboard/settings/currencies");
}

export async function deleteCurrency(id: number) {
  const token = await getTokenFromCookie();
  if (!token) throw new Error("غير مصرح");
  const payload = verifyToken(token);
  if (!payload || payload.role !== 1) throw new Error("غير مصرح");
  const academyId = payload.academyId!;

  // Ensure we don't delete the default currency if it's the only one
  const currency = await db.currency.findUnique({ where: { id } });
  if (!currency) throw new Error("العملة غير موجودة");
  if (currency.isDefault) {
    const count = await db.currency.count({ where: { academyId } });
    if (count === 1) throw new Error("لا يمكن حذف العملة الافتراضية الوحيدة");
  }

  await db.currency.delete({ where: { id, academyId } });
  revalidatePath("/dashboard/settings/currencies");
}

export async function getCurrencies(academyId: number) {
  return db.currency.findMany({
    where: { academyId },
    orderBy: { isDefault: "desc" },
  });
}
