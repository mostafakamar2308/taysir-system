"use server";

import db from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const paymentSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().default("SAR"),
  status: z.number().default(0), // 0 = PENDING
  method: z.number().nullable().optional(),
  date: z.date(),
  dueDate: z.date().nullable().optional(),
  description: z.string().nullable().optional(),
  studentId: z.number(),
  planId: z.number().nullable().optional(),
  recordedBy: z.string().nullable().optional(),
  invoiceUrl: z.string().nullable().optional(),
  channel: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  academyId: z.number(),
});

export async function createPayment(formData: FormData) {
  const rawData = {
    amount: parseFloat(formData.get("amount") as string),
    currency: (formData.get("currency") as string) || "SAR",
    status: formData.get("status")
      ? parseInt(formData.get("status") as string)
      : 0,
    method: formData.get("method")
      ? parseInt(formData.get("method") as string)
      : null,
    date: new Date(formData.get("date") as string),
    dueDate: formData.get("dueDate")
      ? new Date(formData.get("dueDate") as string)
      : null,
    description: (formData.get("description") as string) || null,
    studentId: parseInt(formData.get("studentId") as string),
    planId: formData.get("planId")
      ? parseInt(formData.get("planId") as string)
      : null,
    recordedBy: (formData.get("recordedBy") as string) || null,
    invoiceUrl: (formData.get("invoiceUrl") as string) || null,
    channel: (formData.get("channel") as string) || null,
    notes: (formData.get("notes") as string) || null,
    academyId: parseInt(formData.get("academyId") as string),
  };

  const validated = paymentSchema.parse(rawData);

  await db.payment.create({ data: validated });

  revalidatePath("/dashboard/finances");
}

export async function updatePayment(id: number, formData: FormData) {
  const rawData = {
    amount: parseFloat(formData.get("amount") as string),
    currency: (formData.get("currency") as string) || "SAR",
    status: formData.get("status")
      ? parseInt(formData.get("status") as string)
      : 0,
    method: formData.get("method")
      ? parseInt(formData.get("method") as string)
      : null,
    date: new Date(formData.get("date") as string),
    dueDate: formData.get("dueDate")
      ? new Date(formData.get("dueDate") as string)
      : null,
    description: (formData.get("description") as string) || null,
    studentId: parseInt(formData.get("studentId") as string),
    planId: formData.get("planId")
      ? parseInt(formData.get("planId") as string)
      : null,
    recordedBy: (formData.get("recordedBy") as string) || null,
    invoiceUrl: (formData.get("invoiceUrl") as string) || null,
    channel: (formData.get("channel") as string) || null,
    notes: (formData.get("notes") as string) || null,
  };

  const validated = paymentSchema.partial().parse(rawData); // allow partial update

  await db.payment.update({ where: { id }, data: validated });

  revalidatePath("/dashboard/finances");
}

export async function deletePayment(id: number) {
  await db.payment.delete({ where: { id } });
  revalidatePath("/dashboard/finances");
}

export async function markPaymentAsPaid(id: number) {
  await db.payment.update({ where: { id }, data: { status: 1 } }); // 1 = PAID
  revalidatePath("/dashboard/finances");
}
