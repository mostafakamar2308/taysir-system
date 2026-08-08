"use server";

import db from "@/lib/prisma";
import { user } from "@/lib/auth";
import dayjs from "@/lib/dayjs";
import { revalidatePath } from "next/cache";
import { PaymentStatus } from "@/types/payment";
import { Role } from "@/types/user";
import {
  computeTutorFinancialSummary,
} from "@/lib/tutorFinances";
import { getTutorPeriodRange } from "@/lib/tutorPeriod";
import type {
  TutorFinancialSummary,
  TutorFinancesInput,
} from "@/types/tutorFinances";

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
  const rateMap: Record<number, number> = {};
  rates.forEach((r) => (rateMap[r.currencyId] = r.rate));
  return { defaultCurrencyId: academy.defaultCurrencyId, rateMap };
}

async function findSalaryCostCenterId(): Promise<number | null> {
  const costCenters = await db.costCenter.findMany({
    where: { title: { contains: "مرتبات" } },
    select: { id: true },
    take: 1,
  });
  if (costCenters.length > 0) return costCenters[0].id;
  const fallback = await db.costCenter.findFirst({ select: { id: true } });
  return fallback?.id ?? null;
}

function tutorPath(tutorId: number) {
  return `/ar/dashboard/tutors/${tutorId}`;
}

// ---------- Financial summary + raw data ----------

async function loadTutorFinances(tutorId: number, academyId: number) {
  const tutor = await db.tutor.findUnique({
    where: { id: tutorId },
    select: { id: true, academyId: true, currencyId: true },
  });
  if (!tutor || tutor.academyId !== academyId) throw new Error("غير مصرح");

  const [sessions, payments, conversion] = await Promise.all([
    db.session.findMany({
      where: {
        tutorId,
        academyId,
        startTime: { gte: dayjs.utc().subtract(11, "month").startOf("month").toDate() },
      },
      include: {
        group: { select: { id: true, title: true } },
        participants: {
          include: {
            student: { select: { id: true, user: { select: { name: true } } } },
          },
        },
      },
      orderBy: { startTime: "desc" },
    }),
    db.expense.findMany({
      where: { tutorId, academyId },
      include: {
        currency: { select: { code: true, symbol: true } },
        user: { select: { name: true } },
      },
      orderBy: { date: "desc" },
    }),
    getConversionMap(academyId),
  ]);

  const defaultCurrency =
    (await db.currency.findUnique({
      where: { id: conversion.defaultCurrencyId },
      select: { id: true, code: true, symbol: true },
    })) ??
    (await db.currency.findUnique({
      where: { id: tutor.currencyId },
      select: { id: true, code: true, symbol: true },
    })) ?? { id: tutor.currencyId, code: "EGP", symbol: "ج.م" };

  const data: TutorFinancesInput = {
    tutorId,
    defaultCurrency: {
      id: defaultCurrency.id,
      code: defaultCurrency.code,
      symbol: defaultCurrency.symbol,
    },
    rateMap: conversion.rateMap,
    sessions: sessions.map((s) => ({
      id: s.id,
      groupId: s.group.id,
      groupTitle: s.group.title,
      startTime: s.startTime.toISOString(),
      durationMinutes: s.durationMinutes,
      tutorRate: s.tutorRate,
      isTrial: s.isTrial,
      cancelledBy: s.cancelledBy,
      students: s.participants.map((p) => ({
        id: p.student.id,
        name: p.student.user.name ?? "",
      })),
    })),
    payments: payments.map((p) => ({
      id: p.id,
      amount: p.amount,
      currencyId: p.currencyId,
      currencyCode: p.currency.code,
      currencySymbol: p.currency.symbol,
      method: p.method,
      status: p.status as PaymentStatus,
      date: p.date.toISOString(),
      notes: p.notes,
      month: p.salaryMonth,
      recordedByName: p.user?.name ?? null,
    })),
  };

  const summary = computeTutorFinancialSummary(
    data,
    getTutorPeriodRange("currentMonth"),
  );

  return { data, summary };
}

export async function getTutorFinancialSummary(
  tutorId: number,
): Promise<{ data: TutorFinancesInput; summary: TutorFinancialSummary }> {
  const admin = await requireAdmin();
  return loadTutorFinances(tutorId, admin.academyId!);
}

export async function getTutorSelfFinances(): Promise<{
  data: TutorFinancesInput;
  summary: TutorFinancialSummary;
}> {
  const currentUser = await user();
  if (!currentUser?.tutorId) throw new Error("غير مصرح");
  const tutor = await db.tutor.findUnique({
    where: { id: currentUser.tutorId },
    select: { academyId: true },
  });
  if (!tutor?.academyId) throw new Error("غير مصرح");
  return loadTutorFinances(currentUser.tutorId, tutor.academyId);
}

// ---------- Record payment (one Expense row per allocated period) ----------

export interface TutorPaymentAllocationInput {
  month: string; // "YYYY-MM"
  amount: number;
}

export async function recordTutorPayment(
  tutorId: number,
  payload: {
    amount: number;
    method: number | null;
    date: string;
    notes?: string | null;
    allocations: TutorPaymentAllocationInput[];
  },
) {
  const admin = await requireAdmin();
  const academyId = admin.academyId!;

  const tutor = await db.tutor.findUnique({
    where: { id: tutorId },
    select: { id: true, academyId: true, currencyId: true, user: { select: { name: true } } },
  });
  if (!tutor || tutor.academyId !== academyId) throw new Error("غير مصرح");

  const allocations = payload.allocations.filter((a) => a.amount > 0);
  if (allocations.length === 0) throw new Error("اختر توزيعًا للدفعة");

  const monthRe = /^\d{4}-\d{2}$/;
  if (allocations.some((a) => !monthRe.test(a.month)))
    throw new Error("فترة غير صالحة");

  const total = allocations.reduce((sum, a) => sum + a.amount, 0);
  if (Math.abs(total - payload.amount) > 0.01)
    throw new Error("مجموع التوزيع لا يساوي المبلغ المدفوع");

  const dueDate = dayjs.utc(payload.date).toDate();
  const currencyId = (await db.academy.findUnique({
    where: { id: academyId },
    select: { defaultCurrencyId: true },
  }))?.defaultCurrencyId ?? tutor.currencyId;
  const costCenterId = await findSalaryCostCenterId();
  const tutorName = tutor.user.name ?? `#${tutor.id}`;

  await db.$transaction(async (tx) => {
    for (const a of allocations) {
      await tx.expense.create({
        data: {
          date: dueDate,
          description: `دفعة للمعلم ${tutorName} — ${dayjs
            .utc(`${a.month}-01`)
            .format("MMMM YYYY")}`,
          costCenterId,
          amount: a.amount,
          currencyId,
          method: payload.method,
          status: PaymentStatus.PAID,
          notes: payload.notes ?? null,
          tutorId,
          salaryMonth: a.month,
          academyId,
          recordedBy: admin.id,
        },
      });
    }
  });

  revalidatePath(tutorPath(tutorId));
  revalidatePath("/ar/dashboard/tutor/finances");
  revalidatePath("/ar/dashboard/finances");
}

// ---------- Reverse a payment (auditable, never deleted) ----------

export async function reverseTutorPayment(expenseId: number) {
  const admin = await requireAdmin();
  const academyId = admin.academyId!;

  const expense = await db.expense.findUnique({
    where: { id: expenseId },
    include: {
      tutor: { select: { id: true, academyId: true } },
    },
  });
  if (!expense || !expense.tutor || expense.tutor.academyId !== academyId)
    throw new Error("غير مصرح");

  await db.expense.update({
    where: { id: expenseId },
    data: { status: PaymentStatus.REFUNDED },
  });

  revalidatePath(tutorPath(expense.tutor.id));
  revalidatePath("/ar/dashboard/tutor/finances");
  revalidatePath("/ar/dashboard/finances");
}
