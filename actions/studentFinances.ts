"use server";

import db from "@/lib/prisma";
import { user } from "@/lib/auth";
import dayjs from "@/lib/dayjs";
import { revalidatePath } from "next/cache";
import { PaymentStatus } from "@/types/payment";
import { SubscriptionStatus } from "@/types/subscription";
import { Role } from "@/types/user";
import {
  computeStudentFinancialSummary,
  StudentFinancesInput,
} from "@/lib/studentFinances";
import type { StudentFinancialSummary } from "@/types/studentFinances";

async function requireAdmin() {
  const currentUser = await user();
  if (!currentUser?.academyId || currentUser.role !== Role.Admin)
    throw new Error("غير مصرح");
  return currentUser;
}

async function getConversionMap(academyId: number) {
  const academy = await db.academy.findUnique({
    where: { id: academyId },
    select: { defaultCurrencyId: true },
  });
  if (!academy?.defaultCurrencyId) throw new Error("Default currency not set");
  const rates = await db.academyCurrencyRate.findMany({ where: { academyId } });
  const rateMap = new Map<number, number>();
  rates.forEach((r) => rateMap.set(r.currencyId, r.rate));
  return { defaultCurrencyId: academy.defaultCurrencyId, rateMap };
}

// ---------- Financial summary ----------

export async function getStudentFinancialSummary(
  studentId: number,
): Promise<StudentFinancialSummary> {
  const admin = await requireAdmin();
  const academyId = admin.academyId!;

  const student = await db.student.findUnique({
    where: { id: studentId },
    select: {
      id: true,
      academyId: true,
      billingDate: true,
      currencyId: true,
    },
  });
  if (!student || student.academyId !== academyId) throw new Error("غير مصرح");

  const [memberships, sessionParticipants, revenues, conversion] =
    await Promise.all([
      db.groupStudent.findMany({
        where: { studentId },
        include: {
          group: {
            select: { id: true, title: true, active: true },
          },
          subscriptions: {
            include: {
              plan: { select: { id: true, title: true } },
              currency: { select: { code: true, symbol: true } },
            },
            orderBy: { startDate: "desc" },
          },
        },
        orderBy: { joinedAt: "asc" },
      }),
      db.sessionParticipant.findMany({
        where: { studentId },
        select: {
          session: {
            select: {
              startTime: true,
              groupId: true,
              cancelledBy: true,
              isTrial: true,
            },
          },
        },
      }),
      db.revenue.findMany({
        where: { studentId },
        include: {
          subscription: {
            select: {
              groupStudent: { select: { group: { select: { title: true } } } },
            },
          },
          currency: { select: { code: true, symbol: true } },
        },
        orderBy: { dueDate: "desc" },
      }),
      getConversionMap(academyId),
    ]);

  const subscriptions: StudentFinancesInput["subscriptions"] = [];
  for (const m of memberships) {
    for (const sub of m.subscriptions) {
      subscriptions.push({
        id: sub.id,
        groupStudentId: m.id,
        groupId: m.group.id,
        groupTitle: m.group.title,
        planId: sub.planId,
        planTitle: sub.plan?.title ?? null,
        price: sub.price,
        currencyId: sub.currencyId,
        currencyCode: sub.currency.code,
        currencySymbol: sub.currency.symbol,
        sessionCount: sub.sessionCount,
        billingCycle: sub.billingCycle,
        startDate: sub.startDate,
        endDate: sub.endDate,
        nextBillingDate: sub.nextBillingDate,
        status: sub.status,
        membershipActive: m.active && m.group.active,
      });
    }
  }

  const revenuesInput: StudentFinancesInput["revenues"] = revenues.map((r) => ({
    id: r.id,
    amount: r.amount,
    currencyId: r.currencyId,
    currencyCode: r.currency.code,
    currencySymbol: r.currency.symbol,
    status: r.status,
    method: r.method,
    dueDate: r.dueDate,
    description: r.description,
    subscriptionId: r.subscriptionId,
    subscriptionLabel: r.subscription
      ? r.subscription.groupStudent.group.title
      : null,
  }));

  // Totals are expressed in the academy's default currency (the conversion target).
  const defaultCurrency = (await db.currency.findUnique({
    where: { id: conversion.defaultCurrencyId },
    select: { id: true, code: true, symbol: true },
  })) ??
    (await db.currency.findUnique({
      where: { id: student.currencyId },
      select: { id: true, code: true, symbol: true },
    })) ?? { id: student.currencyId, code: "EGP", symbol: "ج.م" };

  const input: StudentFinancesInput = {
    studentId: student.id,
    billingDateOverride: student.billingDate,
    defaultCurrency: {
      id: defaultCurrency.id,
      code: defaultCurrency.code,
      symbol: defaultCurrency.symbol,
    },
    rateMap: conversion.rateMap,
    subscriptions,
    memberships: memberships.map((m) => ({
      groupStudentId: m.id,
      groupId: m.group.id,
      groupTitle: m.group.title,
      membershipActive: m.active && m.group.active,
    })),
    sessionParticipants,
    revenues: revenuesInput,
  };

  return computeStudentFinancialSummary(input);
}

// ---------- Record payment (one Revenue per allocated subscription) ----------

export interface PaymentAllocationInput {
  subscriptionId: number;
  amount: number;
}

export async function recordStudentPayment(
  studentId: number,
  data: {
    amount: number;
    method: number | null;
    date?: string;
    allocations: PaymentAllocationInput[];
  },
) {
  const admin = await requireAdmin();
  const academyId = admin.academyId!;

  const student = await db.student.findUnique({
    where: { id: studentId },
    select: { id: true, academyId: true },
  });
  if (!student || student.academyId !== academyId) throw new Error("غير مصرح");

  const allocations = data.allocations.filter((a) => a.amount > 0);
  if (allocations.length === 0) throw new Error("اختر توزيعًا للدفعة");

  const total = allocations.reduce((sum, a) => sum + a.amount, 0);
  if (Math.abs(total - data.amount) > 0.01)
    throw new Error("مجموع التوزيع لا يساوي المبلغ المدفوع");

  const subscriptionIds = allocations.map((a) => a.subscriptionId);
  const subs = await db.subscription.findMany({
    where: {
      id: { in: subscriptionIds },
      groupStudent: { studentId },
    },
    include: {
      groupStudent: {
        select: { group: { select: { title: true, academyId: true } } },
      },
    },
  });
  if (subs.length !== subscriptionIds.length)
    throw new Error("أحد الاشتراكات غير موجود أو لا يخص هذا الطالب");
  if (subs.some((s) => s.groupStudent.group.academyId !== academyId))
    throw new Error("غير مصرح");

  const amountById = new Map(
    allocations.map((a) => [a.subscriptionId, a.amount]),
  );
  const dueDate = data.date ? dayjs.utc(data.date).toDate() : new Date();

  await db.$transaction(async (tx) => {
    for (const sub of subs) {
      const amount = amountById.get(sub.id) ?? 0;
      await tx.revenue.create({
        data: {
          amount,
          currencyId: sub.currencyId,
          status: PaymentStatus.PAID,
          method: data.method,
          dueDate,
          description: `دفعة اشتراك ${sub.groupStudent.group.title}`,
          academyId,
          studentId,
          subscriptionId: sub.id,
          planId: sub.planId,
          recordedBy: admin.id,
        },
      });
    }
  });

  revalidatePath("/ar/dashboard");
  revalidatePath(`/ar/dashboard/students/${studentId}`);
}

// ---------- Renew subscription (expire current, create next cycle) ----------

export async function renewSubscription(
  subscriptionId: number,
  data: {
    price: number;
    sessionCount?: number | null;
    billingCycle?: number;
    startDate: string;
  },
) {
  const admin = await requireAdmin();
  const academyId = admin.academyId!;

  const sub = await db.subscription.findUnique({
    where: { id: subscriptionId },
    include: {
      plan: true,
      currency: { select: { id: true } },
      groupStudent: {
        select: {
          id: true,
          studentId: true,
          group: { select: { academyId: true } },
        },
      },
    },
  });
  if (!sub || sub.groupStudent.group.academyId !== academyId)
    throw new Error("غير مصرح");

  const start = dayjs(data.startDate).toDate();
  const billingCycle = data.billingCycle || sub.billingCycle || 30;
  const endDate = dayjs(start).add(billingCycle, "day").toDate();

  await db.$transaction(async (tx) => {
    // Preserve history: expire the current cycle row.
    await tx.subscription.update({
      where: { id: subscriptionId },
      data: { status: SubscriptionStatus.expired, endDate: new Date() },
    });

    await tx.subscription.create({
      data: {
        groupStudentId: sub.groupStudent.id,
        planId: sub.planId,
        price: data.price,
        currencyId: sub.currencyId,
        sessionCount:
          data.sessionCount ??
          sub.sessionCount ??
          sub.plan?.sessionCount ??
          null,
        billingCycle,
        startDate: start,
        endDate,
        nextBillingDate: endDate,
        status: SubscriptionStatus.active,
      },
    });
  });

  revalidatePath("/ar/dashboard");
  revalidatePath(`/ar/dashboard/students/${sub.groupStudent.studentId}`);
  revalidatePath("/ar/dashboard/groups");
}

// ---------- Billing date override ----------

export async function setStudentBillingDate(
  studentId: number,
  date: string | null,
) {
  const admin = await requireAdmin();
  const academyId = admin.academyId!;

  const student = await db.student.findUnique({
    where: { id: studentId },
    select: { id: true, academyId: true },
  });
  if (!student || student.academyId !== academyId) throw new Error("غير مصرح");

  await db.student.update({
    where: { id: studentId },
    data: { billingDate: date ? dayjs.utc(date).toDate() : null },
  });

  revalidatePath(`/ar/dashboard/students/${studentId}`);
  return { billingDate: date };
}
