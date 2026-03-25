"use server";

import db from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getTokenFromCookie, verifyToken } from "@/lib/jwt";
import { PaymentStatus } from "@/types/payment";
import { SubscriptionStatus } from "@/types/subscription";

const planSchema = z.object({
  title: z.string().min(1, "العنوان مطلوب"),
  sessionsPerWeek: z.number().int().positive("يجب أن تكون 1 أو أكثر"),
  price: z.number().positive("السعر يجب أن يكون أكبر من 0"),
  billingPeriod: z.number().int().positive("فترة الفوترة يجب أن تكون إيجابية"),
  currencyId: z.number().int().positive("العملة مطلوبة"),
  academyId: z.number(),
});

export async function createPlan(formData: FormData) {
  const token = await getTokenFromCookie();
  if (!token) throw new Error("غير مصرح");
  const payload = verifyToken(token);
  if (!payload) throw new Error("غير مصرح");

  const rawData = {
    title: formData.get("title"),
    sessionsPerWeek: parseInt(formData.get("sessionsPerWeek") as string),
    price: parseFloat(formData.get("price") as string),
    billingPeriod: parseInt(formData.get("billingPeriod") as string),
    currencyId: parseInt(formData.get("currencyId") as string),
    academyId: parseInt(formData.get("academyId") as string),
  };
  const validated = planSchema.parse(rawData);

  await db.plan.create({ data: validated });

  revalidatePath("/ar/dashboard/plans");
}

export async function updatePlan(id: number, formData: FormData) {
  const token = await getTokenFromCookie();
  if (!token) throw new Error("غير مصرح");
  const payload = verifyToken(token);
  if (!payload) throw new Error("غير مصرح");

  const rawData = {
    title: formData.get("title"),
    sessionsPerWeek: parseInt(formData.get("sessionsPerWeek") as string),
    price: parseFloat(formData.get("price") as string),
    billingPeriod: parseInt(formData.get("billingPeriod") as string),
    currencyId: parseInt(formData.get("currencyId") as string),
  };
  const validated = planSchema.omit({ academyId: true }).parse(rawData);

  await db.plan.update({ where: { id }, data: validated });

  revalidatePath("/ar/dashboard/plans");
  revalidatePath(`/ar/dashboard/plans/${id}`);
}

export async function deletePlan(id: number) {
  const token = await getTokenFromCookie();
  if (!token) throw new Error("غير مصرح");
  const payload = verifyToken(token);
  if (!payload) throw new Error("غير مصرح");

  // Check if plan has active subscriptions
  const activeSubscriptions = await db.subscription.count({
    where: { planId: id, status: 0 }, // 0 = active
  });
  if (activeSubscriptions > 0) {
    throw new Error("لا يمكن حذف خطة لها مشتركين نشطين");
  }

  await db.plan.delete({ where: { id } });

  revalidatePath("/ar/dashboard/plans");
}

export async function getPlans(academyId: number) {
  const plans = await db.plan.findMany({
    where: { academyId },
    include: {
      currency: true,
      subscriptions: {
        where: { status: SubscriptionStatus.active },
        include: { student: true },
      },
      revenues: {
        where: { status: PaymentStatus.PAID },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return plans.map((plan) => ({
    id: plan.id,
    title: plan.title,
    sessionsPerWeek: plan.sessionsPerWeek,
    price: plan.price,
    billingPeriod: plan.billingPeriod,
    currency: plan.currency.name,
    activeStudents: plan.subscriptions.length,
    totalRevenue: plan.revenues.reduce((sum, r) => sum + r.amount, 0),
    subscriptions: plan.subscriptions,
  }));
}
