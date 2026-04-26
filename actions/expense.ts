"use server";

import db from "@/lib/prisma";
import { PaymentStatus } from "@/types/payment";
import dayjs from "@/lib/dayjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getTokenFromCookie, verifyToken } from "@/lib/jwt";
import { AttendanceStatus } from "@/types/session";

const expenseSchema = z.object({
  date: z.date(),
  description: z.string(),
  costCenter: z.string().nullable().optional(),
  amount: z.number().positive(),
  currencyId: z.number(),
  method: z.number().nullable().optional(),
  status: z.number(),
  invoiceUrl: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  tutorId: z.number().nullable().optional(),
  salaryMonth: z.string().nullable().optional(),
  academyId: z.number(),
});

export async function createExpense(formData: FormData) {
  const rawData = {
    date: dayjs.utc(formData.get("date") as string).toDate(),
    description: formData.get("description") as string,
    costCenter: (formData.get("costCenter") as string) || null,
    amount: parseFloat(formData.get("amount") as string),
    currencyId: parseInt(formData.get("currencyId") as string),
    method: formData.get("method")
      ? parseInt(formData.get("method") as string)
      : null,
    status: parseInt(formData.get("status") as string),
    invoiceUrl: (formData.get("invoiceUrl") as string) || null,
    notes: (formData.get("notes") as string) || null,
    tutorId: formData.get("tutorId")
      ? parseInt(formData.get("tutorId") as string)
      : null,
    salaryMonth: (formData.get("salaryMonth") as string) || null,
    academyId: parseInt(formData.get("academyId") as string),
  };

  const validated = expenseSchema.parse(rawData);

  await db.expense.create({ data: validated });

  revalidatePath("/ar/dashboard/finances");
}

export async function updateExpense(id: number, formData: FormData) {
  const rawData = {
    date: new Date(formData.get("date") as string),
    description: formData.get("description") as string,
    costCenter: (formData.get("costCenter") as string) || null,
    amount: parseFloat(formData.get("amount") as string),
    currencyId: parseInt(formData.get("currencyId") as string),
    method: formData.get("method")
      ? parseInt(formData.get("method") as string)
      : null,
    status: parseInt(formData.get("status") as string),
    invoiceUrl: (formData.get("invoiceUrl") as string) || null,
    notes: (formData.get("notes") as string) || null,
    tutorId: formData.get("tutorId")
      ? parseInt(formData.get("tutorId") as string)
      : null,
    salaryMonth: (formData.get("salaryMonth") as string) || null,
  };

  const validated = expenseSchema.partial().parse(rawData);

  await db.expense.update({ where: { id }, data: validated });

  revalidatePath("/ar/dashboard/finances");
}

export async function deleteExpense(id: number) {
  await db.expense.delete({ where: { id } });
  revalidatePath("/ar/dashboard/finances");
}

export async function updateExpenseStatus(id: number, status: PaymentStatus) {
  await db.expense.update({ where: { id }, data: { status: status } });
  revalidatePath("/ar/dashboard/finances");
}

export async function calculateSalaries(month: string, academyId: number) {
  const startDate = new Date(month + "-01");
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + 1);

  const sessions = await db.session.findMany({
    where: {
      startTime: { gte: startDate, lt: endDate },
      academyId,
      attendance: {
        tutorAttendanceStatus: {
          in: [AttendanceStatus.ATTENDED, AttendanceStatus.LATE],
        },
      },
    },
    include: { tutor: { include: { user: true } } },
  });

  // Group by tutor to calculate total sessions and total salary
  const tutorData = new Map<
    number,
    { name: string; price: number; count: number; currencyId: number }
  >();
  for (const s of sessions) {
    if (!tutorData.has(s.tutorId)) {
      tutorData.set(s.tutorId, {
        name: s.tutor.user.name ?? "",
        price: s.tutor.pricePerSession,
        count: 0,
        currencyId: s.tutor.currencyId,
      });
    }
    tutorData.get(s.tutorId)!.count++;
  }

  const expenses = await db.expense.findMany({
    where: {
      salaryMonth: month,
      tutorId: { not: null },
    },
  });

  // Group expenses by tutor and sum amounts
  const paidMap = new Map<number, number>();
  for (const e of expenses) {
    const tutorId = e.tutorId!;
    paidMap.set(tutorId, (paidMap.get(tutorId) || 0) + e.amount);
  }

  // Build results
  const results = Array.from(tutorData.entries()).map(([tutorId, data]) => {
    const total = data.count * data.price;
    const paid = paidMap.get(tutorId) || 0;
    const remaining = total - paid;
    return {
      tutorId,
      tutorName: data.name,
      sessionsCount: data.count,
      pricePerSession: data.price,
      total,
      paid,
      remaining,
      currencyId: data.currencyId,
    };
  });

  return results;
}

export async function payRemainingSalary(
  tutorId: number,
  month: string,
  amount: number,
  notes?: string,
) {
  const token = await getTokenFromCookie();
  if (!token) throw new Error("غير مصرح");
  const payload = verifyToken(token);
  if (!payload) throw new Error("غير مصرح");

  // Get the tutor's academyId and currencyId
  const tutor = await db.tutor.findUnique({
    where: { id: tutorId },
    select: { academyId: true, currencyId: true },
  });
  if (!tutor) throw new Error("المعلم غير موجود");

  await db.expense.create({
    data: {
      date: new Date(),
      description: `راتب شهر ${new Date(month + "-01").toLocaleDateString("ar-EG", { month: "long", year: "numeric" })}`,
      costCenter: "رواتب",
      amount,
      currencyId: tutor.currencyId,
      status: PaymentStatus.PAID,
      tutorId,
      salaryMonth: month,
      notes: notes || null,
      academyId: tutor.academyId,
      recordedBy: payload.id,
    },
  });

  revalidatePath("/dashboard/finances");
}

export async function generateSalaryExpenses(
  month: string,
  tutorIds: number[],
  notes: string | null,
  academyId: number,
) {
  const salaries = await calculateSalaries(month, academyId);
  const selected = salaries.filter((s) => tutorIds.includes(s.tutorId));

  const expensesToCreate = selected.map((s) => ({
    date: new Date(month + "-28"),
    description: `راتب شهر ${new Date(month + "-01").toLocaleDateString("ar-EG", { month: "long", year: "numeric" })}`,
    costCenter: "رواتب",
    amount: s.total,
    currencyId: s.currencyId,
    paymentMethod: 2, // BANK_TRANSFER
    paid: false,
    tutorId: s.tutorId,
    salaryMonth: month,
    notes: notes,
    academyId,
  }));

  await db.expense.createMany({ data: expensesToCreate });

  revalidatePath("/ar/dashboard/finances");
}
