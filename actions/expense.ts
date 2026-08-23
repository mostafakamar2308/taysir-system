"use server";

import db from "@/lib/prisma";
import { PaymentStatus } from "@/types/payment";
import dayjs from "@/lib/dayjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { user } from "@/lib/auth";
import { withResult, fail } from "@/lib/action-result";

const expenseSchema = z.object({
  date: z.date(),
  description: z.string(),
  costCenterId: z.number().nullable(),
  amount: z.number().positive(),
  currencyId: z.number(),
  method: z.number().nullable().optional(),
  status: z.number(),
  invoiceUrl: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  tutorId: z.number().nullable().optional(),
  salaryMonth: z.string().nullable().optional(),
});

export const createExpense = withResult(async (formData: FormData) => {
  const currentUser = await user();
  if (!currentUser) return fail("غير مصرح");

  const rawData = {
    date: dayjs.utc(formData.get("date") as string).toDate(),
    description: formData.get("description") as string,
    costCenterId: parseInt(formData.get("costCenterId") as string) || null,
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

  const validated = expenseSchema.safeParse(rawData);
  if (!validated.success) {
    return fail(validated.error.issues[0]?.message ?? "بيانات غير صحيحة");
  }

  await db.expense.create({
    data: { ...validated.data, academyId: currentUser.academyId! },
  });

  revalidatePath("/ar/dashboard/finances");
});

export const updateExpense = withResult(async (id: number, formData: FormData) => {
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

  const validated = expenseSchema.partial().safeParse(rawData);
  if (!validated.success) {
    return fail(validated.error.issues[0]?.message ?? "بيانات غير صحيحة");
  }

  await db.expense.update({ where: { id }, data: validated.data });

  revalidatePath("/ar/dashboard/finances");
});

export const deleteExpense = withResult(async (id: number) => {
  await db.expense.delete({ where: { id } });
  revalidatePath("/ar/dashboard/finances");
});

export const updateExpenseStatus = withResult(async (id: number, status: PaymentStatus) => {
  await db.expense.update({ where: { id }, data: { status: status } });
  revalidatePath("/ar/dashboard/finances");
});
