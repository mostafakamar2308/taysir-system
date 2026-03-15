"use server";

import { getTokenFromCookie, verifyToken } from "@/lib/jwt";
import db from "@/lib/prisma";
import { StudentStatus } from "@/types/student";
import { SubscriptionStatus } from "@/types/subscription";
import dayjs from "dayjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const createStudentSchema = z.object({
  name: z.string().min(1, "الاسم مطلوب"),
  email: z.string().email("بريد إلكتروني غير صالح").optional().nullable(),
  age: z.number().min(1, "العمر مطلوب"),
  phone: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  timezone: z.string().min(1, "المنطقة الزمنية مطلوبة"),
  status: z.number().default(0),
  startDate: z.date().optional(),
  renewalDate: z.date().optional().nullable(),
  source: z.string().optional().nullable(),
  currentProgram: z.string().optional().nullable(),
  emergencyContactName: z.string().optional().nullable(),
  emergencyContactPhone: z.string().optional().nullable(),
  preferredLanguage: z.string().optional().nullable(),
  tutorId: z.number().optional().nullable(),
  currencyId: z.number(),
  planId: z.number().optional().nullable(),
  academyId: z.number(),
});

export async function createStudent(formData: FormData) {
  const rawData = {
    name: formData.get("name"),
    email: formData.get("email") || null,
    age: formData.get("age")
      ? parseInt(formData.get("age") as string)
      : undefined,
    phone: formData.get("phone") || null,
    country: formData.get("country") || null,
    timezone: formData.get("timezone"),
    currencyId: parseInt(formData.get("currencyId") as string),
    status: formData.get("status")
      ? parseInt(formData.get("status") as string)
      : 0,
    startDate: formData.get("startDate")
      ? new Date(formData.get("startDate") as string)
      : new Date(),
    renewalDate: formData.get("renewalDate")
      ? new Date(formData.get("renewalDate") as string)
      : null,
    source: formData.get("source") || null,
    emergencyContactName: formData.get("emergencyContactName") || null,
    emergencyContactPhone: formData.get("emergencyContactPhone") || null,
    preferredLanguage: formData.get("preferredLanguage") || null,
    tutorId: formData.get("tutorId")
      ? parseInt(formData.get("tutorId") as string)
      : null,
    planId: formData.get("planId")
      ? parseInt(formData.get("planId") as string)
      : null,
    academyId: parseInt(formData.get("academyId") as string),
  };

  const validated = createStudentSchema.parse(rawData);

  await db.student.create({
    data: validated,
  });

  revalidatePath("/ar/dashboard/students");
}

export async function updateStudent(id: number, formData: FormData) {
  const rawData = {
    name: formData.get("name"),
    email: formData.get("email") || null,
    age: formData.get("age")
      ? parseInt(formData.get("age") as string)
      : undefined,
    phone: formData.get("phone") || null,
    country: formData.get("country") || null,
    timezone: formData.get("timezone"),
    currencyId: parseInt(formData.get("currencyId") as string),
    status: formData.get("status")
      ? parseInt(formData.get("status") as string)
      : 0,
    startDate: formData.get("startDate")
      ? new Date(formData.get("startDate") as string)
      : new Date(),
    renewalDate: formData.get("renewalDate")
      ? new Date(formData.get("renewalDate") as string)
      : null,
    source: formData.get("source") || null,
    emergencyContactName: formData.get("emergencyContactName") || null,
    emergencyContactPhone: formData.get("emergencyContactPhone") || null,
    preferredLanguage: formData.get("preferredLanguage") || null,
    tutorId: formData.get("tutorId")
      ? parseInt(formData.get("tutorId") as string)
      : null,
    planId: formData.get("planId")
      ? parseInt(formData.get("planId") as string)
      : null,
    imageUrl: formData.get("imageUrl") || null,
  };

  const validated = createStudentSchema
    .omit({ academyId: true })
    .extend({
      imageUrl: z.string().nullable().optional(),
    })
    .parse(rawData);

  await db.student.update({
    where: { id },
    data: validated,
  });

  revalidatePath("/ar/dashboard/students");
}

export async function getStudent(id: number) {
  const student = await db.student.findUnique({
    where: {
      id,
    },
    include: {
      tutor: {
        include: {
          user: {
            omit: {
              password: true,
            },
          },
        },
      },
      plan: true,
    },
  });

  return student;
}

export async function changeStudentStatusWithSubscription(
  studentId: number,
  status: number,
  subscriptionData?: {
    planId: number;
    startDate: Date;
    endDate?: Date | null;
    autoRenew: boolean;
  },
  note?: string,
) {
  const token = await getTokenFromCookie();
  if (!token) throw new Error("غير مصرح");
  const payload = verifyToken(token);
  if (!payload) throw new Error("غير مصرح");

  // Update student status
  await db.student.update({
    where: { id: studentId },
    data: { status },
  });

  // If status is subscribed and subscription data provided, create a subscription
  if (status === StudentStatus.subscribed && subscriptionData) {
    await db.subscription.updateMany({
      where: {
        studentId,
      },
      data: {
        status: SubscriptionStatus.expired,
      },
    });
    const subscription = await db.subscription.create({
      data: {
        studentId,
        planId: subscriptionData.planId,
        startDate: subscriptionData.startDate,
        endDate: subscriptionData.endDate || null,
        status: dayjs(subscriptionData.startDate).isAfter(dayjs())
          ? SubscriptionStatus.pending
          : SubscriptionStatus.active,
        autoRenew: subscriptionData.autoRenew,
      },
    });

    // Optionally set as current subscription on student
    await db.student.update({
      where: { id: studentId },
      data: { currentSubscriptionId: subscription.id },
    });
  }

  // If note provided, create a note
  if (note?.trim()) {
    await db.note.create({
      data: {
        content: note,
        targetType: 0, // student
        targetId: studentId,
        authorId: payload.id,
      },
    });
  }

  revalidatePath("/ar/dashboard/students");
  revalidatePath(`/ar/dashboard/students/${studentId}`);
}

export async function assignTutor(studentId: number, tutorId: number | null) {
  const token = await getTokenFromCookie();
  if (!token) throw new Error("غير مصرح");
  const payload = verifyToken(token);
  if (!payload) throw new Error("غير مصرح");

  await db.student.update({
    where: { id: studentId },
    data: { tutorId },
  });

  revalidatePath("/ar/dashboard/students");
  revalidatePath(`/ar/dashboard/students/${studentId}`);
}

export async function addNote(studentId: number, content: string) {
  const token = await getTokenFromCookie();
  if (!token) throw new Error("غير مصرح");
  const payload = verifyToken(token);
  if (!payload) throw new Error("غير مصرح");

  await db.note.create({
    data: {
      content,
      targetType: 0, // student
      targetId: studentId,
      authorId: payload.id,
    },
  });

  revalidatePath(`/ar/dashboard/students/${studentId}`);
}

export async function bulkAssignTutor(
  studentIds: number[],
  tutorId: number | null,
) {
  const token = await getTokenFromCookie();
  if (!token) throw new Error("غير مصرح");
  const payload = verifyToken(token);
  if (!payload) throw new Error("غير مصرح");

  await db.student.updateMany({
    where: { id: { in: studentIds } },
    data: { tutorId },
  });

  revalidatePath("/ar/dashboard/students");
}

export async function bulkChangeStatus(
  studentIds: number[],
  status: number,
  planId?: number,
) {
  const token = await getTokenFromCookie();
  if (!token) throw new Error("غير مصرح");
  const payload = verifyToken(token);
  if (!payload) throw new Error("غير مصرح");

  // Update students' status
  await db.student.updateMany({
    where: { id: { in: studentIds } },
    data: { status, planId },
  });

  revalidatePath("/ar/dashboard/students");
}

export async function bulkAddNote(studentIds: number[], content: string) {
  const token = await getTokenFromCookie();
  if (!token) throw new Error("غير مصرح");
  const payload = verifyToken(token);
  if (!payload) throw new Error("غير مصرح");

  await db.note.createMany({
    data: studentIds.map((studentId) => ({
      content,
      targetType: 0, // student
      targetId: studentId,
      authorId: payload.id,
    })),
  });

  revalidatePath("/ar/dashboard/students");
}
