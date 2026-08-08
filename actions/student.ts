"use server";

import { user } from "@/lib/auth";
import {
  recordLeadCreatedHistory,
  recordStudentPlanChangeHistory,
  recordStudentStatusChangeHistory,
  recordStudentTutorChangeHistory,
} from "@/lib/history";
import { getTokenFromCookie, verifyToken } from "@/lib/jwt";
import db from "@/lib/prisma";
import { getSessionStatus } from "@/lib/session";
import { PaymentStatus } from "@/types/payment";
import { StudentStatus } from "@/types/student";
import { GetStudentResult } from "@/types/student";
import { SubscriptionStatus } from "@/types/subscription";
import { SessionRecord } from "@/types/studentProfile";
import { Role } from "@/types/user";
import dayjs from "dayjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import bcrypt from "bcrypt";
import { Prisma } from "@/generated/prisma/client";

const userSchema = z.object({
  name: z.string().min(1, "الاسم مطلوب"),
  email: z.string().email("بريد إلكتروني غير صالح"),
  phone: z.string().optional().nullable(),
  timezone: z.string().min(1, "المنطقة الزمنية مطلوبة"),
  preferredLanguage: z.string().optional().nullable(),
});

// Schema for student-specific fields (stored in Student table)
const studentDataSchema = z.object({
  age: z.number().min(1, "العمر مطلوب"),
  country: z.string().optional().nullable(),
  status: z.number().default(0),
  source: z.string().optional().nullable(),
  currencyId: z.number(),
});

type StudentForTutor = { id: number; userId: number };

// ── Private-group helpers (new group-based model) ────────────────
// "Assigning a tutor" to a student means ensuring the student is an active
// member of a private group (a group with exactly one active member) for that
// tutor, and deactivating memberships in other private groups.

async function getCurrentPrivateTutorId(
  tx: Prisma.TransactionClient,
  studentId: number,
): Promise<number | null> {
  const memberships = await tx.groupStudent.findMany({
    where: { studentId, active: true },
    include: {
      group: {
        include: {
          _count: { select: { members: { where: { active: true } } } },
        },
      },
    },
  });
  const privateMembership = memberships.find(
    (m) => m.group._count.members === 1,
  );
  return privateMembership?.group.currentTutorId ?? null;
}

async function ensurePrivateGroup(
  tx: Prisma.TransactionClient,
  tutorId: number,
  academyId: number,
  student: StudentForTutor,
  studentName: string,
) {
  const candidates = await tx.group.findMany({
    where: { currentTutorId: tutorId, academyId, active: true },
    include: {
      members: { where: { active: true }, select: { studentId: true } },
    },
  });
  const existing = candidates.find(
    (g) =>
      g.members.length === 0 ||
      (g.members.length === 1 && g.members[0].studentId === student.id),
  );

  let groupId = existing?.id;
  if (!groupId) {
    const created = await tx.group.create({
      data: {
        title: `خاص - ${studentName}`,
        academyId,
        currentTutorId: tutorId,
      },
    });
    groupId = created.id;
  }

  await tx.groupStudent.upsert({
    where: { groupId_studentId: { groupId, studentId: student.id } },
    update: { active: true, leftAt: null },
    create: { groupId, studentId: student.id },
  });

  return groupId;
}

async function deactivatePrivateMemberships(
  tx: Prisma.TransactionClient,
  studentId: number,
  exceptGroupId?: number,
): Promise<number[]> {
  const memberships = await tx.groupStudent.findMany({
    where: {
      studentId,
      active: true,
      ...(exceptGroupId ? { groupId: { not: exceptGroupId } } : {}),
    },
    include: {
      group: {
        include: {
          currentTutor: { select: { userId: true } },
          _count: { select: { members: { where: { active: true } } } },
        },
      },
    },
  });

  const affectedTutorUserIds: number[] = [];
  for (const m of memberships) {
    if (m.group._count.members === 1) {
      await tx.groupStudent.update({
        where: { id: m.id },
        data: { active: false, leftAt: new Date() },
      });
      affectedTutorUserIds.push(m.group.currentTutor.userId);
    }
  }
  return affectedTutorUserIds;
}

async function setStudentTutor(
  tx: Prisma.TransactionClient,
  student: StudentForTutor,
  studentName: string,
  tutorId: number | null,
  academyId: number,
): Promise<number | null> {
  const oldTutorId = await getCurrentPrivateTutorId(tx, student.id);

  if (tutorId) {
    const tutor = await tx.tutor.findUnique({
      where: { id: tutorId },
      select: { id: true, userId: true },
    });
    if (!tutor) throw new Error("المعلم غير موجود");

    const groupId = await ensurePrivateGroup(
      tx,
      tutorId,
      academyId,
      student,
      studentName,
    );
    await deactivatePrivateMemberships(tx, student.id, groupId);

    await tx.chatRoom.upsert({
      where: {
        tutorUserId_studentUserId: {
          tutorUserId: tutor.userId,
          studentUserId: student.userId,
        },
      },
      create: {
        tutorUserId: tutor.userId,
        studentUserId: student.userId,
        academyId,
      },
      update: { isClosed: false },
    });
  } else {
    const affectedTutorUserIds = await deactivatePrivateMemberships(
      tx,
      student.id,
    );
    if (affectedTutorUserIds.length > 0) {
      await tx.chatRoom.updateMany({
        where: {
          studentUserId: student.userId,
          tutorUserId: { in: affectedTutorUserIds },
          isClosed: false,
        },
        data: { isClosed: true },
      });
    }
  }

  return oldTutorId;
}

// ── Create ───────────────────────────────────────────────────────
export async function createStudent(formData: FormData) {
  const currentUser = await user();
  if (!currentUser || !currentUser.academyId) throw new Error("غير مصرح");

  // Extract raw data from FormData
  const rawUser = {
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") || null,
    timezone: formData.get("timezone"),
    preferredLanguage: formData.get("preferredLanguage") || null,
  };

  const rawStudent = {
    age: formData.get("age")
      ? parseInt(formData.get("age") as string)
      : undefined,
    country: formData.get("country") || null,
    status: formData.get("status")
      ? parseInt(formData.get("status") as string)
      : 0,
    source: formData.get("source") || null,
    currencyId:
      formData.get("currencyId") && formData.get("currencyId") !== "none"
        ? parseInt(formData.get("currencyId") as string)
        : null,
    tutorId:
      formData.get("tutorId") && formData.get("tutorId") !== "none"
        ? parseInt(formData.get("tutorId") as string)
        : null,
  };

  // Validate both parts
  const validatedUser = userSchema.parse(rawUser);
  const validatedStudent = studentDataSchema.parse(rawStudent);

  // Generate temporary password
  const tempPassword = "default123";
  const hashedPassword = await bcrypt.hash(tempPassword, 10);

  const result = await db.$transaction(async (tx) => {
    // 1. Create User
    const user = await tx.user.create({
      data: {
        name: validatedUser.name,
        email: validatedUser.email,
        password: hashedPassword,
        phone: validatedUser.phone,
        timezone: validatedUser.timezone,
        preferredLanguage: validatedUser.preferredLanguage || "ar",
        role: Role.Student,
      },
    });

    // 2. Create Student
    const student = await tx.student.create({
      data: {
        userId: user.id,
        academyId: currentUser.academyId!,
        age: validatedStudent.age,
        country: validatedStudent.country,
        status: validatedStudent.status,
        currencyId: validatedStudent.currencyId,
        source: validatedStudent.source,
      },
    });

    // 3. If a tutor was selected, create a private-group membership + chat room
    if (rawStudent.tutorId) {
      await setStudentTutor(
        tx,
        student,
        user.name ?? "",
        rawStudent.tutorId,
        currentUser.academyId!,
      );
    }

    return { user, student };
  });

  // If status is "lead", record lead history
  if (validatedStudent.status === StudentStatus.lead) {
    await recordLeadCreatedHistory(
      result.student.id,
      currentUser.id,
      currentUser.academyId!,
    );
  }

  revalidatePath("/ar/dashboard/students");
}

const userUpdateSchema = z.object({
  name: z.string().min(1, "الاسم مطلوب"),
  email: z.string().email("بريد إلكتروني غير صالح"),
  phone: z.string().optional().nullable(),
  timezone: z.string().min(1, "المنطقة الزمنية مطلوبة"),
  preferredLanguage: z.string().optional().nullable(),
});

// Schema for student fields (tutor is managed via group memberships)
const studentUpdateSchema = z.object({
  age: z.number().min(1, "العمر مطلوب"),
  country: z.string().optional().nullable(),
  source: z.string().optional().nullable(),
});

export async function updateStudent(id: number, formData: FormData) {
  const currentUser = await user();
  if (!currentUser || !currentUser.academyId) throw new Error("غير مصرح");

  // 1. Fetch existing student to get userId
  const existingStudent = await db.student.findUnique({
    where: { id },
    include: { user: true },
  });
  if (!existingStudent) throw new Error("الطالب غير موجود");

  // 2. Extract and validate user fields from formData
  const rawUser = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    phone: formData.get("phone") || null,
    timezone: formData.get("timezone") as string,
    preferredLanguage: formData.get("preferredLanguage") || null,
  };
  const validatedUser = userUpdateSchema.parse(rawUser);

  // 3. Extract and validate student fields
  const rawStudent = {
    age: formData.get("age")
      ? parseInt(formData.get("age") as string)
      : undefined,
    country: formData.get("country") || null,
    source: formData.get("source") || null,
  };
  const validatedStudent = studentUpdateSchema.parse(rawStudent);

  // 4. Perform updates in a transaction
  await db.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: existingStudent.userId },
      data: {
        name: validatedUser.name,
        email: validatedUser.email,
        phone: validatedUser.phone,
        timezone: validatedUser.timezone,
        preferredLanguage: validatedUser.preferredLanguage || undefined,
      },
    });

    await tx.student.update({
      where: { id },
      data: {
        age: validatedStudent.age,
        country: validatedStudent.country,
        source: validatedStudent.source,
      },
    });
  });

  revalidatePath("/ar/dashboard/students");
}

export async function getStudent(id: number): Promise<GetStudentResult | null> {
  const student = await db.student.findUnique({
    where: { id },
    include: {
      user: { omit: { password: true } },
      groupMemberships: {
        where: { active: true },
        include: {
          group: {
            include: {
              currentTutor: {
                include: { user: { omit: { password: true } } },
              },
              _count: { select: { members: { where: { active: true } } } },
            },
          },
        },
      },
    },
  });
  if (!student) return null;

  return {
    id: student.id,
    age: student.age,
    country: student.country,
    source: student.source,
    currencyId: student.currencyId,
    user: student.user,
    groupMemberships: student.groupMemberships.map((m) => ({
      id: m.id,
      groupId: m.groupId,
      groupTitle: m.group.title,
      tutorId: m.group.currentTutor.id,
      tutorName: m.group.currentTutor.user.name ?? "غير معروف",
      isPrivate: m.group._count.members === 1,
    })),
  };
}

// ── Status changes (no subscriptions) ────────────────────────────
export async function changeStudentStatus(
  studentId: number,
  status: number,
  note?: string,
) {
  const token = await getTokenFromCookie();
  if (!token) throw new Error("غير مصرح");
  const payload = verifyToken(token);
  if (!payload) throw new Error("غير مصرح");

  const student = await db.student.findUnique({
    where: { id: studentId },
  });
  if (!student) throw new Error("هذا الطالب غير موجود");

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

  const student = await db.student.findUnique({
    where: { id: studentId },
    include: { user: { select: { id: true, name: true } } },
  });
  if (!student) throw new Error("الطالب غير موجود");

  const oldTutorId = await db.$transaction(async (tx) =>
    setStudentTutor(
      tx,
      student,
      student.user.name ?? "",
      tutorId,
      payload.academyId!,
    ),
  );

  await recordStudentTutorChangeHistory(
    studentId,
    oldTutorId,
    tutorId,
    payload.id,
    payload.academyId,
  );

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
      targetType: 0,
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
  if (!payload || !payload.academyId) throw new Error("غير مصرح");

  const students = await db.student.findMany({
    where: { id: { in: studentIds } },
    include: { user: { select: { id: true, name: true } } },
  });

  const changes: { studentId: number; oldTutorId: number | null }[] = [];

  await db.$transaction(async (tx) => {
    for (const student of students) {
      const oldTutorId = await setStudentTutor(
        tx,
        student,
        student.user.name ?? "",
        tutorId,
        payload.academyId!,
      );
      changes.push({ studentId: student.id, oldTutorId });
    }
  });

  for (const change of changes) {
    await recordStudentTutorChangeHistory(
      change.studentId,
      change.oldTutorId,
      tutorId,
      payload.id,
      payload.academyId,
    );
  }

  revalidatePath("/ar/dashboard/students");
}

export async function bulkChangeStatus(studentIds: number[], status: number) {
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
    data: { status },
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
      academyId: student.academyId,
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
      sessionsBalance: {
        increment: plan.sessionsPerWeek * 4,
      },
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
      dueDate: new Date(),
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
      method,
      invoiceUrl,
      status: PaymentStatus.PAID,
      recordedBy: payload.id,
    },
  });

  revalidatePath(`/dashboard/students/${payment.student.id}`);
  revalidatePath("/dashboard/finances");
}

export async function renewSubscription(studentId: number, paid?: boolean) {
  const currentUser = await user();
  if (!currentUser || currentUser.role !== Role.Admin)
    throw new Error("غير مصرح");

  const student = await db.student.findUnique({
    where: {
      id: studentId,
    },
    include: {
      subscriptions: true,
      plan: true,
    },
  });

  if (
    !student ||
    student.status !== StudentStatus.subscribed ||
    !student.planId
  )
    throw new Error("هذا الطالب غير مشترك أصلا");

  const activeSubs = await db.subscription.findMany({
    where: {
      studentId,
      status: SubscriptionStatus.active,
    },
  });

  const plan = await db.plan.findUnique({ where: { id: student.planId } });
  if (!plan) throw new Error("الباقة غير موجودة");

  await db.$transaction(async (tx) => {
    // revoke active subscription
    await tx.subscription.updateMany({
      where: {
        id: {
          in: activeSubs.map((s) => s.id),
        },
      },
      data: {
        status: SubscriptionStatus.expired,
      },
    });

    // create new subscription
    const sub = await tx.subscription.create({
      data: {
        studentId: student.id,
        academyId: student.academyId,
        planId: student.planId!,
        startDate: dayjs.utc().startOf("day").toDate(),
        endDate: dayjs.utc().endOf("day").add(1, "month").toDate(),
        status: SubscriptionStatus.active,
      },
    });

    await tx.revenue.create({
      data: {
        amount: plan.price,
        currencyId: plan.currencyId,
        academyId: student.academyId,
        studentId: student.id,
        description: `تجديد إشتراك شهر ${dayjs().format("MMMM YYYY")} `,
        subscriptionId: sub.id,
        planId: plan.id,
        recordedBy: currentUser.id,
        dueDate: paid
          ? dayjs.utc().toDate()
          : dayjs.utc().startOf("day").add(1, "month").toDate(),
        status: paid ? PaymentStatus.PAID : PaymentStatus.PENDING,
      },
    });

    await tx.student.update({
      where: {
        id: student.id,
      },
      data: {
        sessionsBalance: {
          increment: plan.sessionsPerWeek * 4,
        },
        currentSubscriptionId: sub.id,
        status: StudentStatus.subscribed,
      },
    });
  });

  revalidatePath(`/ar/dashboard/students/${studentId}`);
}

export async function getStudentSessionsForWeek(
  studentId: number,
  weekStart: string,
): Promise<SessionRecord[]> {
  const start = dayjs.utc(weekStart).startOf("day");
  const end = start.add(7, "day");

  const participants = await db.sessionParticipant.findMany({
    where: {
      studentId,
      session: { startTime: { gte: start.toDate(), lt: end.toDate() } },
    },
    include: {
      session: {
        include: {
          group: {
            select: {
              id: true,
              title: true,
              currentTutor: { include: { user: true } },
            },
          },
        },
      },
      report: true,
      homeworkSolutions: { take: 1, orderBy: { createdAt: "desc" } },
    },
    orderBy: { session: { startTime: "asc" } },
  });

  return participants.map((p) => {
    const solution = p.homeworkSolutions[0] ?? null;
    return {
      id: p.session.id,
      startTime: p.session.startTime.toISOString(),
      endTime: dayjs(p.session.startTime)
        .add(p.session.durationMinutes, "minute")
        .toISOString(),
      durationMinutes: p.session.durationMinutes,
      status: getSessionStatus(p.session),
      topic: p.session.topic,
      notes: p.session.notes,
      tutorId: p.session.group.currentTutor.id,
      tutorName: p.session.group.currentTutor.user.name ?? "",
      groupId: p.session.group.id,
      groupName: p.session.group.title,
      attendance: {
        id: p.id,
        status: p.studentAttendanceStatus,
        reason: p.reason ?? null,
      },
      report: p.report
        ? {
            id: p.report.id,
            rating: p.report.rating,
            outcomes: p.report.outcomes,
            strengths: p.report.strengths,
            weaknesses: p.report.weaknesses,
            nextGoals: p.report.nextGoals,
            comments: p.report.comments,
          }
        : null,
      homeworkSolution: solution
        ? {
            id: solution.id,
            score: solution.score,
            submittedAt: solution.submittedAt.toISOString(),
            gradedAt: solution.gradedAt?.toISOString() ?? null,
          }
        : null,
    };
  });
}
