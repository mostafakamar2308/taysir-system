"use server";

import db from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const expenseSchema = z.object({
  date: z.date(),
  description: z.string().min(1),
  costCenter: z.string().nullable().optional(),
  amount: z.number().positive(),
  currency: z.string().default("SAR"),
  paymentMethod: z.number().nullable().optional(),
  paid: z.boolean().default(false),
  reference: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  tutorId: z.number().nullable().optional(),
  salaryMonth: z.string().nullable().optional(),
  academyId: z.number(),
});

export async function createExpense(formData: FormData) {
  const rawData = {
    date: new Date(formData.get("date") as string),
    description: formData.get("description") as string,
    costCenter: (formData.get("costCenter") as string) || null,
    amount: parseFloat(formData.get("amount") as string),
    currency: (formData.get("currency") as string) || "SAR",
    paymentMethod: formData.get("paymentMethod")
      ? parseInt(formData.get("paymentMethod") as string)
      : null,
    paid: formData.get("paid") === "true",
    reference: (formData.get("reference") as string) || null,
    notes: (formData.get("notes") as string) || null,
    tutorId: formData.get("tutorId")
      ? parseInt(formData.get("tutorId") as string)
      : null,
    salaryMonth: (formData.get("salaryMonth") as string) || null,
    academyId: parseInt(formData.get("academyId") as string),
  };

  const validated = expenseSchema.parse(rawData);

  await db.expense.create({ data: validated });

  revalidatePath("/dashboard/finances");
}

export async function updateExpense(id: number, formData: FormData) {
  const rawData = {
    date: new Date(formData.get("date") as string),
    description: formData.get("description") as string,
    costCenter: (formData.get("costCenter") as string) || null,
    amount: parseFloat(formData.get("amount") as string),
    currency: (formData.get("currency") as string) || "SAR",
    paymentMethod: formData.get("paymentMethod")
      ? parseInt(formData.get("paymentMethod") as string)
      : null,
    paid: formData.get("paid") === "true",
    reference: (formData.get("reference") as string) || null,
    notes: (formData.get("notes") as string) || null,
    tutorId: formData.get("tutorId")
      ? parseInt(formData.get("tutorId") as string)
      : null,
    salaryMonth: (formData.get("salaryMonth") as string) || null,
  };

  const validated = expenseSchema.partial().parse(rawData);

  await db.expense.update({ where: { id }, data: validated });

  revalidatePath("/dashboard/finances");
}

export async function deleteExpense(id: number) {
  await db.expense.delete({ where: { id } });
  revalidatePath("/dashboard/finances");
}

export async function toggleExpensePaid(id: number, paid: boolean) {
  await db.expense.update({ where: { id }, data: { paid } });
  revalidatePath("/dashboard/finances");
}

export async function calculateSalaries(month: string) {
  const startDate = new Date(month + "-01");
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + 1);

  const sessions = await db.session.findMany({
    where: {
      startTime: { gte: startDate, lt: endDate },
      status: 1, // COMPLETED
      attendance: { status: { in: [0, 3] } }, // ATTENDED or LATE
    },
    include: { tutor: { include: { user: true } } },
  });

  const tutorMap = new Map<
    number,
    { name: string; price: number; count: number }
  >();

  for (const s of sessions) {
    if (!tutorMap.has(s.tutorId)) {
      tutorMap.set(s.tutorId, {
        name: s.tutor.user.name ?? "",
        price: s.tutor.pricePerSession,
        count: 0,
      });
    }
    tutorMap.get(s.tutorId)!.count++;
  }

  const results = Array.from(tutorMap.entries()).map(([tutorId, data]) => ({
    tutorId,
    tutorName: data.name,
    sessionsCount: data.count,
    pricePerSession: data.price,
    total: data.count * data.price,
    existingExpense: null,
  }));

  const expenses = await db.expense.findMany({
    where: { salaryMonth: month, tutorId: { not: null } },
  });

  const expenseMap = new Map(expenses.map((e) => [e.tutorId, e]));

  return results.map((r) => ({
    ...r,
    existingExpense: r.tutorId ? expenseMap.get(r.tutorId) : null,
  }));
}

export async function generateSalaryExpenses(
  month: string,
  tutorIds: number[],
  notes: string | null,
  academyId: number,
) {
  const salaries = await calculateSalaries(month);
  const selected = salaries.filter((s) => tutorIds.includes(s.tutorId));

  const expensesToCreate = selected.map((s) => ({
    date: new Date(month + "-28"),
    description: `راتب شهر ${new Date(month + "-01").toLocaleDateString("ar-EG", { month: "long", year: "numeric" })}`,
    costCenter: "رواتب",
    amount: s.total,
    currency: "SAR",
    paymentMethod: 2, // BANK_TRANSFER
    paid: false,
    tutorId: s.tutorId,
    salaryMonth: month,
    notes: notes,
    academyId,
  }));

  await db.expense.createMany({ data: expensesToCreate });

  revalidatePath("/dashboard/finances");
}
