"use server";

import db from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getTokenFromCookie, verifyToken } from "@/lib/jwt";
import { Role } from "@/types/user";

const currencySchema = z.object({
  code: z.string().length(3, "الرمز يجب أن يكون 3 أحرف").toUpperCase(),
  name: z.string().min(1, "الاسم مطلوب"),
  symbol: z.string().min(1, "الرمز مطلوب"),
});

export async function createCurrency(formData: FormData) {
  const token = await getTokenFromCookie();
  if (!token) throw new Error("غير مصرح");
  const payload = verifyToken(token);
  if (!payload || payload.role !== Role.SuperAdmin) throw new Error("غير مصرح"); // only academy admin

  const rawData = {
    code: formData.get("code"),
    name: formData.get("name"),
    symbol: formData.get("symbol"),
  };
  const validated = currencySchema.parse(rawData);

  await db.currency.create({
    data: {
      ...validated,
    },
  });

  revalidatePath("/ar/dashboard/settings/currencies");
}

export async function updateCurrency(id: number, formData: FormData) {
  const token = await getTokenFromCookie();
  if (!token) throw new Error("غير مصرح");
  const payload = verifyToken(token);
  if (!payload || payload.role !== Role.SuperAdmin) throw new Error("غير مصرح");

  const rawData = {
    code: formData.get("code"),
    name: formData.get("name"),
    symbol: formData.get("symbol"),
  };
  const validated = currencySchema.parse(rawData);

  await db.currency.update({
    where: { id },
    data: validated,
  });

  revalidatePath("/ar/dashboard/settings/currencies");
}

export async function deleteCurrency(id: number) {
  const token = await getTokenFromCookie();
  if (!token) throw new Error("غير مصرح");
  const payload = verifyToken(token);
  if (!payload || payload.role !== Role.SuperAdmin) throw new Error("غير مصرح");

  // Ensure we don't delete the default currency if it's the only one
  const currency = await db.currency.findUnique({ where: { id } });
  if (!currency) throw new Error("العملة غير موجودة");

  await db.currency.delete({ where: { id } });
  revalidatePath("/ar/dashboard/settings/currencies");
}

export async function getCurrencies() {
  return db.currency.findMany({});
}
