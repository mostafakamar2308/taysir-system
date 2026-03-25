"use server";

import {
  recordLeadCreatedHistory,
  recordStudentPlanChangeHistory,
  recordStudentStatusChangeHistory,
  recordStudentTutorChangeHistory,
} from "@/lib/history";
import { getTokenFromCookie, verifyToken } from "@/lib/jwt";
import db from "@/lib/prisma";
import { HistoryActionType, TargetType } from "@/types/history";
import { PaymentStatus } from "@/types/payment";
import { StudentStatus } from "@/types/student";
import { SubscriptionStatus } from "@/types/subscription";
import { Role } from "@/types/user";
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
  const token = await getTokenFromCookie();
  if (!token) throw new Error("غير مصرح");
  const payload = verifyToken(token);
  if (!payload || !payload.academyId) throw new Error("غير مصرح");

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
    source: formData.get("source") || null,
    emergencyContactName: formData.get("emergencyContactName") || null,
    emergencyContactPhone: formData.get("emergencyContactPhone") || null,
    currentProgram: formData.get("currentProgram") || null,
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

  const student = await db.student.create({
    data: validated,
  });
  if (validated.status === StudentStatus.lead) {
    await recordLeadCreatedHistory(student.id, payload.id, validated.academyId);
  }

  revalidatePath("/ar/dashboard/students");
}

export async function updateStudent(id: number, formData: FormData) {
  const token = await getTokenFromCookie();
  if (!token) throw new Error("غير مصرح");
  const payload = verifyToken(token);
  if (!payload || !payload.academyId) throw new Error("غير مصرح");

  const rawData = {
    name: formData.get("name"),
    email: formData.get("email") || null,
    age: formData.get("age")
      ? parseInt(formData.get("age") as string)
      : undefined,
    phone: formData.get("phone") || null,
    country: formData.get("country") || null,
    timezone: formData.get("timezone"),
    currencyId: formData.get("currencyId")
      ? parseInt(formData.get("currencyId") as string)
      : undefined,
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
  console.log({ rawData });
  console.log(formData.get("currencyId") as string);

  const validated = createStudentSchema
    .omit({ academyId: true })
    .extend({
      imageUrl: z.string().nullable().optional(),
      currencyId: z.number().optional(),
    })
    .parse(rawData);

  await db.student.update({
    where: { id },
    data: validated,
  });

  if (validated.status === StudentStatus.lead)
    await db.history.create({
      data: {
        targetType: TargetType.Student,
        targetId: id,
        action: HistoryActionType.LeadCreated,
        recordedBy: payload.id,
        academyId: payload.academyId,
        recorderType: Role.Admin,
      },
    });

  if (
    [StudentStatus.paused, StudentStatus.churned].includes(validated.status)
  ) {
    await db.subscription.updateMany({
      where: {
        studentId: id,
      },
      data: {
        status: SubscriptionStatus.cancelled,
      },
    });
    await db.student.update({
      where: { id },
      data: {
        currentSubscriptionId: null,
        planId: null,
      },
    });
  }

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

  const student = await db.student.findUnique({
    where: {
      id: studentId,
    },
  });
  if (!student) throw new Error("هذا الطالب غير موجود");

  // Update student status
  await db.student.update({
    where: { id: studentId },
    data: { status },
  });

  await recordStudentStatusChangeHistory(
    studentId,
    student.status,
    status,
    payload.id,
    student.academyId,
  );

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
      },
    });

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
  if (!payload || !payload.academyId) throw new Error("غير مصرح");

  await db.student.update({
    where: { id: studentId },
    data: { tutorId },
  });
  await db.history.create({
    data: {
      targetType: TargetType.Student,
      targetId: studentId,
      action: HistoryActionType.StudentTutorChange,
      recordedBy: payload.id,
      recorderType: TargetType.Admin,
      academyId: payload.academyId,
    },
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

  // Fetch current tutors for these students
  const students = await db.student.findMany({
    where: { id: { in: studentIds } },
    select: { id: true, tutorId: true, academyId: true },
  });

  // Update all students
  await db.student.updateMany({
    where: { id: { in: studentIds } },
    data: { tutorId },
  });

  // Record history for each student (if tutor changed)
  for (const student of students) {
    if (student.tutorId !== tutorId) {
      await recordStudentTutorChangeHistory(
        student.id,
        student.tutorId,
        tutorId,
        payload.id,
        student.academyId,
      );
    }
  }

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

  // Fetch current statuses
  const students = await db.student.findMany({
    where: { id: { in: studentIds } },
    select: { id: true, status: true, academyId: true },
  });

  // Update statuses
  await db.student.updateMany({
    where: { id: { in: studentIds } },
    data: { status, planId },
  });

  for (const student of students) {
    if (student.status !== status) {
      await recordStudentStatusChangeHistory(
        student.id,
        student.status,
        status,
        payload.id,
        student.academyId,
      );
    }
  }

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

export async function changePlan(studentId: number, newPlanId: number) {
  const token = await getTokenFromCookie();
  if (!token) throw new Error("غير مصرح");
  const payload = verifyToken(token);
  if (!payload) throw new Error("غير مصرح");

  // Get the student to know the old plan and academyId
  const student = await db.student.findUnique({
    where: { id: studentId },
  });
  const plan = await db.plan.findUnique({
    where: { id: newPlanId },
  });
  if (!student || !plan) throw new Error("Student or Plan not found");

  // Expire current active subscription
  await db.subscription.updateMany({
    where: {
      studentId,
      status: SubscriptionStatus.active,
    },
    data: {
      status: SubscriptionStatus.expired,
      endDate: dayjs().toDate(),
    },
  });

  // Create new subscription
  const newSubscription = await db.subscription.create({
    data: {
      studentId,
      planId: newPlanId,
      startDate: new Date(),
      endDate: dayjs().add(1, "month").toDate(),
      status: SubscriptionStatus.active,
    },
  });

  await db.revenue.create({
    data: {
      amount: plan.price,
      academyId: student.academyId,
      currencyId: plan.currencyId,
      studentId,
      recordedBy: payload.id,
      subscriptionId: newSubscription.id,
      dueDate: newSubscription.startDate,
      status: PaymentStatus.PENDING,
    },
  });

  // Update student's current subscription and plan
  await db.student.update({
    where: { id: studentId },
    data: {
      currentSubscriptionId: newSubscription.id,
      planId: newPlanId,
      status: StudentStatus.subscribed,
    },
  });

  if (student.status !== StudentStatus.subscribed)
    await recordStudentStatusChangeHistory(
      student.id,
      student.status,
      StudentStatus.subscribed,
      payload.id,
      student.academyId,
    );

  // Record history if plan changed
  if (student.planId !== newPlanId) {
    await recordStudentPlanChangeHistory(
      studentId,
      student.planId,
      newPlanId,
      payload.id,
      student.academyId,
    );
  }

  revalidatePath(`/ar/dashboard/students/${studentId}`);
  revalidatePath("/ar/dashboard/students");
  return newSubscription;
}

export async function recordPayment(
  studentId: number,
  subscriptionId: number,
  amount: number,
  method: number,
  description?: string,
) {
  const token = await getTokenFromCookie();
  if (!token) throw new Error("غير مصرح");
  const payload = verifyToken(token);
  if (!payload || !payload.academyId) throw new Error("غير مصرح");

  // Get subscription to find its plan's currency
  const subscription = await db.subscription.findUnique({
    where: { id: subscriptionId },
    include: { plan: true },
  });
  if (!subscription) throw new Error("الاشتراك غير موجود");

  const payment = await db.revenue.create({
    data: {
      amount,
      currencyId: subscription.plan.currencyId,
      status: 1,
      method,
      date: new Date(),
      description: description || `دفعة اشتراك ${subscription.plan.title}`,
      studentId,
      subscriptionId,
      planId: subscription.planId,
      academyId: payload.academyId,
    },
  });

  await db.subscription.update({
    where: {
      id: subscriptionId,
    },
    data: {
      endDate: dayjs().add(1, "month").toDate(),
      startDate: dayjs().toDate(),
      status: SubscriptionStatus.active,
    },
  });

  revalidatePath(`/ar/dashboard/students/${studentId}`);
  return payment;
}

export async function resolvePayment(
  paymentId: number,
  amount: number,
  method: number | null,
  invoiceUrl: string | null,
) {
  const token = await getTokenFromCookie();
  if (!token) throw new Error("غير مصرح");
  const payload = verifyToken(token);
  if (!payload) throw new Error("غير مصرح");

  const payment = await db.revenue.findUnique({
    where: { id: paymentId },
    include: { student: { select: { id: true } } },
  });
  if (!payment) throw new Error("الدفعة غير موجودة");
  if (payment.status !== PaymentStatus.PENDING)
    throw new Error("يمكن فقط تسوية الدفعات المعلقة");

  await db.revenue.update({
    where: { id: paymentId },
    data: {
      amount,
      method,
      invoiceUrl,
      status: PaymentStatus.PAID,
      recordedBy: payload.id,
    },
  });

  revalidatePath(`/dashboard/students/${payment.student.id}`);
  revalidatePath("/dashboard/finances");
}
