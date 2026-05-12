"use server";

import db from "@/lib/prisma";
import { PaymentStatus } from "@/types/payment";
import dayjs from "@/lib/dayjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";

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
