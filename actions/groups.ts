"use server";

import db from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { user } from "@/lib/auth";
import dayjs from "@/lib/dayjs";
import { SubscriptionStatus } from "@/types/subscription";
import { Prisma } from "@/generated/prisma/client";
import type { TutorOption, StudentOption } from "@/types/group";

async function ensureAdmin() {
  const currentUser = await user();
  if (!currentUser || !currentUser.academyId) return null;
  return currentUser;
}

// ---------- Group chat room helpers ----------

// Create the group chat room for a group if it does not exist yet.
async function ensureGroupChatRoom(
  tx: Prisma.TransactionClient,
  groupId: number,
  academyId: number,
) {
  return tx.groupChatRoom.upsert({
    where: { groupId },
    update: {},
    create: { groupId, academyId },
  });
}

// Add/activate a chat member for a group room (soft-join).
async function addGroupChatMember(
  tx: Prisma.TransactionClient,
  roomId: number,
  userId: number,
) {
  return tx.groupChatMember.upsert({
    where: { roomId_userId: { roomId, userId } },
    update: { active: true, leftAt: null },
    create: { roomId, userId },
  });
}

// Deactivate a chat member for a group room (soft-leave).
async function deactivateGroupChatMember(
  tx: Prisma.TransactionClient,
  roomId: number,
  userId: number,
) {
  return tx.groupChatMember.updateMany({
    where: { roomId, userId, active: true },
    data: { active: false, leftAt: new Date() },
  });
}

// Ensure the room exists and every group student + the current tutor are members.
async function syncGroupChatMembers(
  tx: Prisma.TransactionClient,
  groupId: number,
  academyId: number,
  studentIds: number[],
  tutorUserId: number | null,
) {
  const room = await ensureGroupChatRoom(tx, groupId, academyId);
  for (const studentId of studentIds) {
    const student = await tx.student.findUnique({
      where: { id: studentId },
      select: { userId: true },
    });
    if (student) await addGroupChatMember(tx, room.id, student.userId);
  }
  if (tutorUserId) await addGroupChatMember(tx, room.id, tutorUserId);
  return room;
}

// Create an active subscription for an enrollment when no active one exists.
async function autoCreateSubscription(
  tx: Prisma.TransactionClient,
  groupStudentId: number,
  price: number,
  currencyId: number,
) {
  const existing = await tx.subscription.findFirst({
    where: { groupStudentId, status: SubscriptionStatus.active },
    select: { id: true },
  });
  if (existing) return null;

  const startDate = new Date();
  const endDate = dayjs().add(30, "day").toDate();
  return tx.subscription.create({
    data: {
      groupStudentId,
      price,
      currencyId,
      billingCycle: 30,
      startDate,
      endDate,
      nextBillingDate: endDate,
      status: SubscriptionStatus.active,
    },
  });
}

// Fetch all active tutors for the academy (for dropdowns)
export async function getAcademyTutors(): Promise<TutorOption[]> {
  const admin = await ensureAdmin();

  const academyId = admin?.academyId;
  if (!academyId) return [];
  const tutors = await db.tutor.findMany({
    where: { academyId, active: true },
    select: {
      id: true,
      user: { select: { name: true } },
      baseGroupHourlyRate: true,
    },
    orderBy: { user: { name: "asc" } },
  });
  return tutors.map((t) => ({
    id: t.id,
    name: t.user.name ?? "",
    baseGroupHourlyRate: t.baseGroupHourlyRate,
  }));
}

// Fetch all students for the academy (for add to group)
export async function getAcademyStudents(): Promise<StudentOption[]> {
  const admin = await ensureAdmin();
  const academyId = admin?.academyId;
  if (!academyId) return [];
  const students = await db.student.findMany({
    where: { academyId },
    select: { id: true, user: { select: { name: true } } },
    orderBy: { user: { name: "asc" } },
  });
  return students.map((s) => ({ id: s.id, name: s.user.name ?? "" }));
}

// Create group
export async function createGroup(formData: FormData) {
  const admin = await ensureAdmin();
  const academyId = admin?.academyId;
  if (!academyId) throw new Error("غير مصرح");

  const title = formData.get("title") as string;
  const tutorId = parseInt(formData.get("tutorId") as string);
  const tutorHourlyRateStr = formData.get("tutorHourlyRate") as string | null;
  const tutorHourlyRate = tutorHourlyRateStr
    ? parseFloat(tutorHourlyRateStr)
    : null;

  if (!title || !tutorId) throw new Error("العنوان والمعلم مطلوبان");

  const tutor = await db.tutor.findUnique({
    where: { id: tutorId },
    select: { userId: true },
  });
  if (!tutor) throw new Error("المعلم غير موجود");

  await db.$transaction(async (tx) => {
    const group = await tx.group.create({
      data: {
        title,
        academyId,
        currentTutorId: tutorId,
        tutorHourlyRate,
      },
    });

    await syncGroupChatMembers(
      tx,
      group.id,
      academyId,
      [],
      tutor.userId,
    );
  });

  revalidatePath("/ar/dashboard/groups");
}

// Update group (title, tutor, rate)
export async function updateGroup(groupId: number, formData: FormData) {
  const admin = await ensureAdmin();
  const academyId = admin?.academyId;
  if (!academyId) throw new Error("غير مصرح");

  const group = await db.group.findUnique({
    where: { id: groupId },
    select: { academyId: true, currentTutorId: true },
  });
  if (!group || group.academyId !== academyId) throw new Error("غير مصرح");

  const title = formData.get("title") as string;
  const tutorId = parseInt(formData.get("tutorId") as string);
  const tutorHourlyRateStr = formData.get("tutorHourlyRate") as string | null;
  const tutorHourlyRate = tutorHourlyRateStr
    ? parseFloat(tutorHourlyRateStr)
    : null;

  if (!title || !tutorId) throw new Error("العنوان والمعلم مطلوبان");

  await db.$transaction(async (tx) => {
    await tx.group.update({
      where: { id: groupId },
      data: {
        title,
        currentTutorId: tutorId,
        tutorHourlyRate,
      },
    });

    const room = await ensureGroupChatRoom(tx, groupId, academyId);

    if (group.currentTutorId !== tutorId) {
      const oldTutor = await tx.tutor.findUnique({
        where: { id: group.currentTutorId },
        select: { userId: true },
      });
      if (oldTutor) await deactivateGroupChatMember(tx, room.id, oldTutor.userId);

      const newTutor = await tx.tutor.findUnique({
        where: { id: tutorId },
        select: { userId: true },
      });
      if (newTutor) await addGroupChatMember(tx, room.id, newTutor.userId);
    }
  });

  revalidatePath("/ar/dashboard/groups");
}

// Add students to group (by student IDs).
// Auto-creates an active Subscription per enrollment when the group has a
// determinable default student price (> 0).
export async function addStudentsToGroup(
  groupId: number,
  studentIds: number[],
) {
  const admin = await ensureAdmin();
  const academyId = admin?.academyId;
  if (!academyId) throw new Error("غير مصرح");

  const group = await db.group.findUnique({
    where: { id: groupId },
    select: {
      academyId: true,
      studentSessionPrice: true,
      currentTutor: { select: { userId: true } },
    },
  });
  if (!group || group.academyId !== academyId) throw new Error("غير مصرح");

  await db.$transaction(async (tx) => {
    for (const sid of studentIds) {
      const gs = await tx.groupStudent.upsert({
        where: { groupId_studentId: { groupId, studentId: sid } },
        update: { active: true, leftAt: null },
        create: { groupId, studentId: sid },
      });

      const price = group.studentSessionPrice;
      if (price && price > 0) {
        const student = await tx.student.findUnique({
          where: { id: sid },
          select: { currencyId: true },
        });
        await autoCreateSubscription(
          tx,
          gs.id,
          price,
          student?.currencyId ?? 1,
        );
      }
    }

    await syncGroupChatMembers(
      tx,
      groupId,
      academyId,
      studentIds,
      group.currentTutor.userId,
    );
  });

  revalidatePath("/ar/dashboard/groups");
}

// Remove students from group (deactivate membership)
export async function removeStudentsFromGroup(
  groupId: number,
  studentIds: number[],
) {
  const admin = await ensureAdmin();
  const academyId = admin?.academyId;
  if (!academyId) throw new Error("غير مصرح");

  const group = await db.group.findUnique({
    where: { id: groupId },
    select: { academyId: true },
  });
  if (!group || group.academyId !== academyId) throw new Error("غير مصرح");

  await db.$transaction(async (tx) => {
    await tx.groupStudent.updateMany({
      where: { groupId, studentId: { in: studentIds } },
      data: { active: false, leftAt: new Date() },
    });

    const room = await tx.groupChatRoom.findUnique({ where: { groupId } });
    if (room) {
      const students = await tx.student.findMany({
        where: { id: { in: studentIds } },
        select: { userId: true },
      });
      for (const s of students) {
        await deactivateGroupChatMember(tx, room.id, s.userId);
      }
    }
  });

  revalidatePath("/ar/dashboard/groups");
}

// Activate / deactivate membership
export async function toggleStudentMembership(
  groupId: number,
  studentId: number,
  active: boolean,
) {
  const admin = await ensureAdmin();
  const academyId = admin?.academyId;
  if (!academyId) throw new Error("غير مصرح");

  const group = await db.group.findUnique({
    where: { id: groupId },
    select: {
      academyId: true,
      studentSessionPrice: true,
      currentTutor: { select: { userId: true } },
    },
  });
  if (!group || group.academyId !== academyId) throw new Error("غير مصرح");

  await db.$transaction(async (tx) => {
    const room = await ensureGroupChatRoom(tx, groupId, academyId);
    const student = await tx.student.findUnique({
      where: { id: studentId },
      select: { userId: true, currencyId: true },
    });
    if (!student) throw new Error("الطالب غير موجود");

    if (active) {
      const gs = await tx.groupStudent.upsert({
        where: { groupId_studentId: { groupId, studentId } },
        update: { active: true, leftAt: null },
        create: { groupId, studentId },
      });
      const price = group.studentSessionPrice;
      if (price && price > 0) {
        await autoCreateSubscription(tx, gs.id, price, student.currencyId);
      }
      await addGroupChatMember(tx, room.id, student.userId);
    } else {
      await tx.groupStudent.updateMany({
        where: { groupId, studentId },
        data: { active: false, leftAt: new Date() },
      });
      await tx.subscription.updateMany({
        where: {
          groupStudent: { groupId, studentId },
          status: SubscriptionStatus.active,
        },
        data: {
          status: SubscriptionStatus.cancelled,
          endDate: new Date(),
        },
      });
      await deactivateGroupChatMember(tx, room.id, student.userId);
    }
  });

  revalidatePath("/ar/dashboard/groups");
}

// ---------- Subscription management (per enrollment) ----------

async function getManagedGroupStudent(
  groupStudentId: number,
  academyId: number,
) {
  return db.groupStudent.findUnique({
    where: { id: groupStudentId },
    select: { id: true, studentId: true, group: { select: { academyId: true } } },
  });
}

export async function createSubscriptionForEnrollment(
  groupStudentId: number,
  data: {
    price: number;
    currencyId: number;
    planId?: number | null;
    sessionCount?: number | null;
    billingCycle?: number;
    startDate?: string;
  },
) {
  const admin = await ensureAdmin();
  const academyId = admin?.academyId;
  if (!academyId) throw new Error("غير مصرح");

  const gs = await getManagedGroupStudent(groupStudentId, academyId);
  if (!gs || gs.group.academyId !== academyId) throw new Error("غير مصرح");

  const start = data.startDate ? dayjs(data.startDate).toDate() : new Date();
  const billingCycle = data.billingCycle || 30;
  const endDate = dayjs(start).add(billingCycle, "day").toDate();

  const sub = await db.subscription.create({
    data: {
      groupStudentId,
      planId: data.planId ?? null,
      price: data.price,
      currencyId: data.currencyId,
      sessionCount: data.sessionCount ?? null,
      billingCycle,
      startDate: start,
      endDate,
      nextBillingDate: endDate,
      status: SubscriptionStatus.active,
    },
  });

  revalidatePath("/ar/dashboard/groups");
  revalidatePath(`/ar/dashboard/students/${gs.studentId}`);
  return sub;
}

export async function updateSubscription(
  subscriptionId: number,
  data: {
    price?: number;
    planId?: number | null;
    sessionCount?: number | null;
    billingCycle?: number;
    endDate?: string | null;
    nextBillingDate?: string | null;
    status?: number;
  },
) {
  const admin = await ensureAdmin();
  const academyId = admin?.academyId;
  if (!academyId) throw new Error("غير مصرح");

  const sub = await db.subscription.findUnique({
    where: { id: subscriptionId },
    include: {
      groupStudent: {
        select: {
          studentId: true,
          group: { select: { academyId: true } },
        },
      },
    },
  });
  if (!sub || sub.groupStudent.group.academyId !== academyId)
    throw new Error("غير مصرح");

  await db.subscription.update({
    where: { id: subscriptionId },
    data: {
      price: data.price,
      planId: data.planId,
      sessionCount: data.sessionCount,
      billingCycle: data.billingCycle,
      endDate: data.endDate ? new Date(data.endDate) : data.endDate === null ? null : undefined,
      nextBillingDate: data.nextBillingDate
        ? new Date(data.nextBillingDate)
        : data.nextBillingDate === null
          ? null
          : undefined,
      status: data.status,
    },
  });

  revalidatePath("/ar/dashboard/groups");
  revalidatePath(`/ar/dashboard/students/${sub.groupStudent.studentId}`);
}

export async function cancelSubscription(subscriptionId: number) {
  const admin = await ensureAdmin();
  const academyId = admin?.academyId;
  if (!academyId) throw new Error("غير مصرح");

  const sub = await db.subscription.findUnique({
    where: { id: subscriptionId },
    include: {
      groupStudent: {
        select: {
          studentId: true,
          group: { select: { academyId: true } },
        },
      },
    },
  });
  if (!sub || sub.groupStudent.group.academyId !== academyId)
    throw new Error("غير مصرح");

  await db.subscription.update({
    where: { id: subscriptionId },
    data: { status: SubscriptionStatus.cancelled, endDate: new Date() },
  });

  revalidatePath("/ar/dashboard/groups");
  revalidatePath(`/ar/dashboard/students/${sub.groupStudent.studentId}`);
}

// Active subscription + payments for one enrollment
export async function getEnrollmentSubscription(groupStudentId: number) {
  const admin = await ensureAdmin();
  const academyId = admin?.academyId;
  if (!academyId) return null;

  const gs = await db.groupStudent.findUnique({
    where: { id: groupStudentId },
    include: { group: { select: { academyId: true } } },
  });
  if (!gs || gs.group.academyId !== academyId) return null;

  const sub = await db.subscription.findFirst({
    where: { groupStudentId, status: SubscriptionStatus.active },
    include: {
      plan: { select: { id: true, title: true } },
      currency: { select: { code: true, symbol: true } },
      payments: {
        select: {
          id: true,
          amount: true,
          status: true,
          method: true,
          dueDate: true,
        },
        orderBy: { dueDate: "desc" },
      },
    },
    orderBy: { startDate: "desc" },
  });

  if (!sub) return null;
  return {
    id: sub.id,
    groupStudentId: sub.groupStudentId,
    planId: sub.planId,
    planTitle: sub.plan?.title ?? null,
    price: sub.price,
    currencyCode: sub.currency.code,
    currencySymbol: sub.currency.symbol,
    sessionCount: sub.sessionCount,
    billingCycle: sub.billingCycle,
    startDate: sub.startDate.toISOString(),
    endDate: sub.endDate?.toISOString() ?? null,
    nextBillingDate: sub.nextBillingDate?.toISOString() ?? null,
    status: sub.status,
    payments: sub.payments.map((p) => ({
      id: p.id,
      amount: p.amount,
      status: p.status,
      method: p.method,
      dueDate: p.dueDate.toISOString(),
    })),
  };
}
