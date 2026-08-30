"use server";

import db from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getTokenFromCookie, verifyToken } from "@/lib/jwt";
import { withResult, fail } from "@/lib/action-result";
import { Role } from "@/types/user";
import { getAcademySchedulingSettings } from "@/lib/academySettings";

export const getAcademySettings = withResult(async (academyId: number) => {
  const academy = await db.academy.findUnique({
    where: { id: academyId },
    include: { defaultCurrency: true },
  });
  if (!academy) return fail("الأكاديمية غير موجودة");

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
});

export const updateDefaultCurrency = withResult(
  async (academyId: number, newCurrencyId: number) => {
    const token = await getTokenFromCookie();
    if (!token) return fail("غير مصرح");
    const payload = verifyToken(token);
    if (!payload) return fail("غير مصرح");

    // Ensure the new currency exists
    const currency = await db.currency.findUnique({
      where: { id: newCurrencyId },
    });
    if (!currency) return fail("العملة غير موجودة");

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
  },
);

export const getAcademySchedulingSettingsAction = withResult(
  async (academyId: number) => {
    return getAcademySchedulingSettings(academyId);
  },
);

export const updateAcademySchedulingSettings = withResult(
  async (
    academyId: number,
    data: {
      tutorsCanCreateSessions?: boolean;
      tutorsCanEditSessionTime?: boolean;
    },
  ) => {
    const token = await getTokenFromCookie();
    if (!token) return fail("غير مصرح");
    const payload = verifyToken(token);
    if (!payload || payload.role !== Role.SuperAdmin) return fail("غير مصرح");

    await db.academySettings.upsert({
      where: { academyId },
      update: {
        ...(data.tutorsCanCreateSessions !== undefined
          ? { tutorsCanCreateSessions: data.tutorsCanCreateSessions }
          : {}),
        ...(data.tutorsCanEditSessionTime !== undefined
          ? { tutorsCanEditSessionTime: data.tutorsCanEditSessionTime }
          : {}),
      },
      create: {
        academyId,
        tutorsCanCreateSessions: data.tutorsCanCreateSessions ?? true,
        tutorsCanEditSessionTime: data.tutorsCanEditSessionTime ?? true,
      },
    });

    revalidatePath(`/ar/dashboard/admin/academies/${academyId}`);
  },
);

// Update exchange rate for a specific currency (relative to the default)
export const updateExchangeRate = withResult(
  async (academyId: number, currencyId: number, rate: number) => {
    const token = await getTokenFromCookie();
    if (!token) return fail("غير مصرح");
    const payload = verifyToken(token);
    if (!payload) return fail("غير مصرح");

    // Cannot set rate for default currency (it's always 1)
    const academy = await db.academy.findUnique({
      where: { id: academyId },
      select: { defaultCurrencyId: true },
    });
    if (!academy) return fail("الأكاديمية غير موجودة");
    if (currencyId === academy.defaultCurrencyId) {
      return fail("لا يمكن تعيين سعر صرف للعملة الافتراضية");
    }

    if (rate <= 0) return fail("سعر الصرف يجب أن يكون أكبر من 0");

    await db.academyCurrencyRate.upsert({
      where: { academyId_currencyId: { academyId, currencyId } },
      update: { rate },
      create: { academyId, currencyId, rate },
    });

    revalidatePath("/ar/dashboard/settings/currencies");
  },
);
