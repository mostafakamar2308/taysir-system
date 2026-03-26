"use server";

import db from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getTokenFromCookie, verifyToken } from "@/lib/jwt";

export async function getAcademySettings(academyId: number) {
  const academy = await db.academy.findUnique({
    where: { id: academyId },
    include: { defaultCurrency: true },
  });
  if (!academy) throw new Error("Academy not found");

  const allCurrencies = await db.currency.findMany();
  const rates = await db.academyCurrencyRate.findMany({
    where: { academyId },
  });
  const rateMap = new Map(rates.map((r) => [r.currencyId, r.rate]));

  const currenciesWithRates = allCurrencies.map((c) => ({
    id: c.id,
    code: c.code,
    name: c.name,
    symbol: c.symbol,
    rate: c.id === academy.defaultCurrencyId ? 1 : rateMap.get(c.id) || null,
  }));

  return {
    defaultCurrencyId: academy.defaultCurrencyId,
    defaultCurrency: academy.defaultCurrency,
    currencies: currenciesWithRates,
  };
}

export async function updateDefaultCurrency(
  academyId: number,
  newCurrencyId: number,
) {
  const token = await getTokenFromCookie();
  if (!token) throw new Error("غير مصرح");
  const payload = verifyToken(token);
  if (!payload) throw new Error("غير مصرح");

  // Ensure the new currency exists
  const currency = await db.currency.findUnique({
    where: { id: newCurrencyId },
  });
  if (!currency) throw new Error("Currency not found");

  await db.academy.update({
    where: { id: academyId },
    data: { defaultCurrencyId: newCurrencyId },
  });

  // Optionally, set the rate of the new default currency to 1 (if it had a different rate)
  await db.academyCurrencyRate.upsert({
    where: { academyId_currencyId: { academyId, currencyId: newCurrencyId } },
    update: { rate: 1 },
    create: { academyId, currencyId: newCurrencyId, rate: 1 },
  });

  revalidatePath("/ar/dashboard/settings/currencies");
}

// Update exchange rate for a specific currency (relative to the default)
export async function updateExchangeRate(
  academyId: number,
  currencyId: number,
  rate: number,
) {
  const token = await getTokenFromCookie();
  if (!token) throw new Error("غير مصرح");
  const payload = verifyToken(token);
  if (!payload) throw new Error("غير مصرح");

  // Cannot set rate for default currency (it's always 1)
  const academy = await db.academy.findUnique({
    where: { id: academyId },
    select: { defaultCurrencyId: true },
  });
  if (!academy) throw new Error("Academy not found");
  if (currencyId === academy.defaultCurrencyId) {
    throw new Error("لا يمكن تعيين سعر صرف للعملة الافتراضية");
  }

  if (rate <= 0) throw new Error("سعر الصرف يجب أن يكون أكبر من 0");

  await db.academyCurrencyRate.upsert({
    where: { academyId_currencyId: { academyId, currencyId } },
    update: { rate },
    create: { academyId, currencyId, rate },
  });

  revalidatePath("/ar/dashboard/settings/currencies");
}
