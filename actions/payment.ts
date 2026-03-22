"use server";

import { getTokenFromCookie, verifyToken } from "@/lib/jwt";
import db from "@/lib/prisma";
import { PaymentMethod, PaymentStatus } from "@/types/payment";
import { Role } from "@/types/user";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import dayjs from "@/lib/dayjs";

const paymentSchema = z.object({
  amount: z.number().positive(),
  currencyId: z.number(),
  status: z.number().default(PaymentStatus.PENDING),
  method: z.number().nullable().optional(),
  date: z.date(),
  dueDate: z.date().nullable().optional(),
  description: z.string().nullable().optional(),
  studentId: z.number(),
  planId: z.number().nullable().optional(),
  recordedBy: z.number().nullable().optional(),
  invoiceUrl: z.string().nullable().optional(),
  channel: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  academyId: z.number(),
});

export async function createPayment(formData: FormData) {
  const rawData = {
    amount: parseFloat(formData.get("amount") as string),
    currencyId: parseInt(formData.get("currency") as string) || "SAR",
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

  await db.revenue.create({ data: validated });

  revalidatePath("/ar/dashboard/finances");
}

export async function updatePayment(id: number, formData: FormData) {
  const rawData = {
    amount: parseFloat(formData.get("amount") as string),
    currencyId: parseInt(formData.get("currency") as string),
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

  const validated = paymentSchema.partial().parse(rawData);

  await db.revenue.update({ where: { id }, data: validated });

  revalidatePath("/ar/dashboard/finances");
}

export async function deletePayment(id: number) {
  await db.revenue.delete({ where: { id } });
  revalidatePath("/ar/dashboard/finances");
}

export async function markPaymentAsPaid(id: number) {
  await db.revenue.update({
    where: { id },
    data: { status: PaymentStatus.PAID },
  }); // 1 = PAID
  revalidatePath("/ar/dashboard/finances");
}

export async function createRevenueFromDashboard(revenueData: {
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  studentId: number;
  dueDate: string | null;
  recordedBy: null;
  academyId: number;
  date: string;
  description: string;
  invoiceUrl: string;
  notes: string;
}) {
  const token = await getTokenFromCookie();
  if (!token) throw new Error("غير مصرح");
  const payload = verifyToken(token);
  if (!payload || payload.role !== Role.Admin) throw new Error("غير مصرح");

  const student = await db.student.findUnique({
    where: { id: revenueData.studentId },
  });
  if (!student) throw new Error("لا يوجد طالب بهذا الاسم");

  await db.revenue.create({
    data: {
      ...revenueData,
      currencyId: student.currencyId,
      planId: student.planId,
      recordedBy: payload.id,
      subscriptionId: student.currentSubscriptionId,
      date: dayjs.utc(revenueData.date).toDate(),
      dueDate: revenueData.dueDate
        ? dayjs.utc(revenueData.date).toDate()
        : null,
    },
  });
  revalidatePath("/ar/dashboard");
}
