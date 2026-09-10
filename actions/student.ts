"use server";

import { user } from "@/lib/auth";
import {
  recordLeadCreatedHistory,
  recordStudentPlanChangeHistory,
  recordStudentStatusChangeHistory,
  recordStudentTutorChangeHistory,
} from "@/lib/history";
import { getTokenFromCookie, verifyToken } from "@/lib/jwt";
import { withResult, fail, ActionError } from "@/lib/action-result";
import db from "@/lib/prisma";
import { getSessionStatus } from "@/lib/session";
import { markStudentSubscribed } from "@/lib/studentStatus";
import { PaymentStatus } from "@/types/payment";
import { StudentStatus } from "@/types/student";
import { SubscriptionStatus } from "@/types/subscription";
import { Role } from "@/types/user";
import {
  buildUsernameSuggestions,
  isValidUsername,
  normalizeUsername,
} from "@/lib/username";
import dayjs from "dayjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import bcrypt from "bcrypt";
import { Prisma } from "@/generated/prisma/client";
import { uniqueViolationField } from "@/lib/prisma-error";

const usernameField = z
  .string()
  .min(1, "اسم المستخدم مطلوب")
  .refine(
    (value) => {
      const normalized = normalizeUsername(value);
      return normalized.length >= 3 && isValidUsername(normalized);
    },
    "اسم المستخدم يجب أن يكون 3-30 حرفًا (حروف إنجليزية وأرقام ونقاط وشرطات سفلية)",
  );

const userUpdateSchema = z.object({
  name: z.string().min(1, "الاسم مطلوب"),
  email: z.string().optional().nullable(),
  username: usernameField.optional().nullable(),
  phone: z.string().optional().nullable(),
  timezone: z.string().min(1, "المنطقة الزمنية مطلوبة"),
  preferredLanguage: z.string().optional().nullable(),
});

/** Real-time username availability check used by the add/edit dialogs. */
export const checkUsername = withResult(
  async (rawUsername: string, excludeId?: number) => {
    const username = normalizeUsername(rawUsername);

    if (!username) {
      return {
        username: "",
        valid: false,
        available: false,
        suggestions: [],
      };
    }

    const taken = await db.user.findMany({
      where: {
        username: { not: null },
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: { username: true },
    });
    const takenSet = new Set(
      taken.map((u) => u.username as string),
    );

    const valid = isValidUsername(username);
    if (!valid) {
      return {
        username,
        valid: false,
        available: false,
        suggestions: [],
      };
    }

    const available = !takenSet.has(username);
    return {
      username,
      valid: true,
      available,
      suggestions: available
        ? []
        : buildUsernameSuggestions(username, takenSet),
    };
  },
);

// One subscription enrollment: membership in an existing public group OR a
// private 1-on-1 group (selected via tutor), plus its subscription details.
const subscriptionEnrollmentSchema = z.object({
  groupId: z.number().int().positive().optional().nullable(),
  tutorId: z.number().int().positive().optional().nullable(),
  planId: z.number().int().positive().optional().nullable(),
  price: z.number().positive("سعر الاشتراك مطلوب"),
  sessionCount: z.number().int().positive().optional().nullable(),
  billingCycle: z.number().int().positive("دورة الفوترة مطلوبة"),
  startDate: z.string().min(1, "تاريخ البدء مطلوب"),
});

// Payment split: one allocation per created subscription (by enrollment order).
const createStudentPaymentSchema = z.object({
  amount: z.number().nonnegative("المبلغ المدفوع مطلوب"),
  method: z.number().nullable(),
  date: z.string(),
  allocations: z.array(
    z.object({
      enrollmentIndex: z.number().int().nonnegative(),
      amount: z.number().nonnegative(),
    }),
  ),
});

// Full structured input for the 2-step add-student wizard.
const createStudentSchema = z.object({
  name: z.string().min(1, "الاسم مطلوب"),
  email: z.string().optional().nullable(),
  username: usernameField,
  phone: z.string().optional().nullable(),
  timezone: z.string().min(1, "المنطقة الزمنية مطلوبة"),
  preferredLanguage: z.string().optional().nullable(),
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
  age: z.number().min(1, "العمر مطلوب"),
  country: z.string().optional().nullable(),
  status: z.number().default(0),
  source: z.string().optional().nullable(),
  currencyId: z.number(),
  enrollments: z.array(subscriptionEnrollmentSchema).default([]),
  payment: createStudentPaymentSchema.optional(),
});

type CreateStudentInput = z.infer<typeof createStudentSchema>;

// Add the student (and tutor when private) as active members of the group's
// chat room, mirroring addStudentsToGroup's behavior.
async function syncEnrollmentChat(
  tx: Prisma.TransactionClient,
  groupId: number,
  academyId: number,
  studentUserId: number,
  tutorUserId: number | null,
) {
  const room = await tx.groupChatRoom.upsert({
    where: { groupId },
    update: {},
    create: { groupId, academyId },
  });
  await tx.groupChatMember.upsert({
    where: {
      roomId_userId: { roomId: room.id, userId: studentUserId },
    },
    update: { active: true, leftAt: null },
    create: { roomId: room.id, userId: studentUserId },
  });
  if (tutorUserId) {
    await tx.groupChatMember.upsert({
      where: { roomId_userId: { roomId: room.id, userId: tutorUserId } },
      update: { active: true, leftAt: null },
      create: { roomId: room.id, userId: tutorUserId },
    });
  }
}

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
    if (!tutor) return fail("المعلم غير موجود");

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
export const createStudent = withResult(async (input: CreateStudentInput) => {
  const currentUser = await user();
  if (!currentUser || !currentUser.academyId) return fail("غير مصرح");
  const academyId = currentUser.academyId;

  const validated = createStudentSchema.safeParse(input);
  if (!validated.success) {
    return fail(validated.error.issues[0]?.message ?? "بيانات غير صحيحة");
  }
  const data = validated.data;
  const username = normalizeUsername(data.username);

  const isSubscribed = data.status === StudentStatus.subscribed;

  // Cross-field validation
  if (isSubscribed && data.enrollments.length === 0) {
    return fail("الطالب المشترك يجب أن يكون في مجموعة واحدة على الأقل");
  }
  for (const enc of data.enrollments) {
    if (!enc.groupId && !enc.tutorId) {
      return fail("اختر مجموعة أو معلمًا لكل اشتراك");
    }
    if (enc.groupId && enc.tutorId) {
      return fail("اختر إما مجموعة أو معلمًا لكل اشتراك، وليس كلاهما");
    }
  }
  if (data.payment && data.payment.amount > 0) {
    if (!isSubscribed) {
      return fail("لا يمكن تسجيل دفعة دون اشتراك");
    }
    const allocTotal = data.payment.allocations.reduce(
      (sum, a) => sum + a.amount,
      0,
    );
    if (Math.abs(allocTotal - data.payment.amount) > 0.01) {
      return fail("مجموع توزيع الدفعة لا يساوي المبلغ المدفوع");
    }
    for (const alloc of data.payment.allocations) {
      if (
        alloc.enrollmentIndex < 0 ||
        alloc.enrollmentIndex >= data.enrollments.length
      ) {
        return fail("توزيع الدفعة غير صالح");
      }
    }
  }

  // Hash provided password
  const hashedPassword = await bcrypt.hash(data.password, 10);

  let result: { user: { id: number }; student: { id: number } };
  try {
    result = await db.$transaction(async (tx) => {
      const duplicates = await tx.user.count({
        where: { username },
      });
      if (duplicates > 0) {
        throw new ActionError(
          "اسم المستخدم هذا مستخدم بالفعل، اختر اسمًا آخر",
        );
      }

      // 1. Create User
      const user = await tx.user.create({
        data: {
          name: data.name,
          email: data.email || null,
          username,
          password: hashedPassword,
          phone: data.phone,
          timezone: data.timezone,
          preferredLanguage: data.preferredLanguage || "ar",
          role: Role.Student,
        },
      });

      // 2. Create Student
      const student = await tx.student.create({
        data: {
          userId: user.id,
          academyId,
          age: data.age,
          country: data.country,
          status: data.status,
          currencyId: data.currencyId,
          source: data.source,
        },
      });

      // 3. Enrollments + subscriptions (only when subscribed)
      const subscriptionIds: number[] = [];
      if (isSubscribed) {
        for (const enc of data.enrollments) {
          // Resolve the target group
          let groupId: number;
          let tutorUserId: number | null = null;
          if (enc.groupId) {
            const group = await tx.group.findUnique({
              where: { id: enc.groupId },
              select: {
                id: true,
                academyId: true,
                currentTutor: { select: { userId: true } },
              },
            });
            if (!group || group.academyId !== academyId) {
              throw new ActionError("المجموعة غير موجودة");
            }
            groupId = group.id;
            tutorUserId = group.currentTutor.userId;
          } else {
            const tutor = await tx.tutor.findUnique({
              where: { id: enc.tutorId! },
              select: { id: true, userId: true },
            });
            if (!tutor) throw new ActionError("المعلم غير موجود");
            groupId = await ensurePrivateGroup(
              tx,
              tutor.id,
              academyId,
              student,
              user.name ?? "",
            );
            tutorUserId = tutor.userId;
            await tx.chatRoom.upsert({
              where: {
                tutorUserId_studentUserId: {
                  tutorUserId: tutor.userId,
                  studentUserId: user.id,
                },
              },
              create: {
                tutorUserId: tutor.userId,
                studentUserId: user.id,
                academyId,
              },
              update: { isClosed: false },
            });
          }

          // Membership
          const gs = await tx.groupStudent.upsert({
            where: {
              groupId_studentId: { groupId, studentId: student.id },
            },
            update: { active: true, leftAt: null },
            create: { groupId, studentId: student.id },
          });

          await syncEnrollmentChat(
            tx,
            groupId,
            academyId,
            user.id,
            tutorUserId,
          );

          // Subscription
          const startDate = dayjs(enc.startDate).toDate();
          const endDate = dayjs(startDate).add(enc.billingCycle, "day").toDate();
          const sub = await tx.subscription.create({
            data: {
              groupStudentId: gs.id,
              planId: enc.planId ?? null,
              price: enc.price,
              currencyId: data.currencyId,
              sessionCount: enc.sessionCount ?? null,
              billingCycle: enc.billingCycle,
              startDate,
              endDate,
              nextBillingDate: endDate,
              status: SubscriptionStatus.active,
            },
          });
          subscriptionIds.push(sub.id);
        }
      }

      // 4. Payment split across the created subscriptions
      if (data.payment && data.payment.amount > 0) {
        const dueDate = dayjs.utc(data.payment.date).toDate();
        for (const alloc of data.payment.allocations) {
          if (alloc.amount <= 0) continue;
          const subId = subscriptionIds[alloc.enrollmentIndex];
          const subInfo = await tx.subscription.findUnique({
            where: { id: subId },
            select: {
              currencyId: true,
              planId: true,
              groupStudent: {
                select: { group: { select: { title: true } } },
              },
            },
          });
          if (!subInfo) throw new ActionError("الاشتراك غير موجود");
          await tx.revenue.create({
            data: {
              amount: alloc.amount,
              currencyId: subInfo.currencyId,
              status: PaymentStatus.PAID,
              method: data.payment.method,
              dueDate,
              description: `دفعة اشتراك ${subInfo.groupStudent.group.title}`,
              academyId,
              studentId: student.id,
              subscriptionId: subId,
              planId: subInfo.planId,
              recordedBy: currentUser.id,
            },
          });
        }
      }

      return { user, student };
    });
  } catch (err) {
    if (err instanceof ActionError) throw err;
    if (uniqueViolationField(err)?.includes("username")) {
      throw new ActionError("اسم المستخدم هذا مستخدم بالفعل، اختر اسمًا آخر");
    }
    throw err;
  }

  // If status is "lead", record lead history
  if (data.status === StudentStatus.lead) {
    await recordLeadCreatedHistory(result.student.id, currentUser.id, academyId);
  }

  revalidatePath("/ar/dashboard/students");
  revalidatePath("/ar/dashboard/groups");
});

// Schema for student fields (tutor is managed via group memberships)
const studentUpdateSchema = z.object({
  age: z.number().min(1, "العمر مطلوب"),
  country: z.string().optional().nullable(),
  source: z.string().optional().nullable(),
});

export const updateStudent = withResult(
  async (id: number, formData: FormData) => {
    const currentUser = await user();
    if (!currentUser || !currentUser.academyId) return fail("غير مصرح");

    // 1. Fetch existing student to get userId
    const existingStudent = await db.student.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!existingStudent) return fail("الطالب غير موجود");

    // 2. Extract and validate user fields from formData
    const rawUser = {
      name: formData.get("name") as string,
      email:
        formData.get("email") && (formData.get("email") as string).trim() !== ""
          ? (formData.get("email") as string).trim()
          : null,
      username:
        formData.get("username") && (formData.get("username") as string).trim()
          ? normalizeUsername(formData.get("username") as string)
          : null,
      phone: formData.get("phone") || null,
      timezone: formData.get("timezone") as string,
      preferredLanguage: formData.get("preferredLanguage") || null,
    };
    const validatedUser = userUpdateSchema.safeParse(rawUser);
    if (!validatedUser.success) {
      return fail(validatedUser.error.issues[0]?.message ?? "بيانات غير صحيحة");
    }

    // 3. Extract and validate student fields
    const rawStudent = {
      age: formData.get("age")
        ? parseInt(formData.get("age") as string)
        : undefined,
      country: formData.get("country") || null,
      source: formData.get("source") || null,
    };
    const validatedStudent = studentUpdateSchema.safeParse(rawStudent);
    if (!validatedStudent.success) {
      return fail(
        validatedStudent.error.issues[0]?.message ?? "بيانات غير صحيحة",
      );
    }

    // 4. Perform updates in a transaction
    try {
      await db.$transaction(async (tx) => {
        if (validatedUser.data.username) {
          const duplicates = await tx.user.count({
            where: {
              username: validatedUser.data.username,
              NOT: { id: existingStudent.userId },
            },
          });
          if (duplicates > 0) {
            throw new ActionError(
              "اسم المستخدم هذا مستخدم بالفعل، اختر اسمًا آخر",
            );
          }
        }

        await tx.user.update({
          where: { id: existingStudent.userId },
          data: {
            name: validatedUser.data.name,
            email: validatedUser.data.email || null,
            username:
              validatedUser.data.username ?? existingStudent.user.username,
            phone: validatedUser.data.phone,
            timezone: validatedUser.data.timezone,
            preferredLanguage: validatedUser.data.preferredLanguage || undefined,
          },
        });

        await tx.student.update({
          where: { id },
          data: {
            age: validatedStudent.data.age,
            country: validatedStudent.data.country,
            source: validatedStudent.data.source,
          },
        });
      });
    } catch (err) {
      if (err instanceof ActionError) throw err;
      if (uniqueViolationField(err)?.includes("username")) {
        throw new ActionError("اسم المستخدم هذا مستخدم بالفعل، اختر اسمًا آخر");
      }
      throw err;
    }

    revalidatePath("/ar/dashboard/students");
  },
);

export const getStudent = withResult(async (id: number) => {
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
});

// ── Status changes (no subscriptions) ────────────────────────────
export const changeStudentStatus = withResult(
  async (studentId: number, status: number, note?: string) => {
    const token = await getTokenFromCookie();
    if (!token) return fail("غير مصرح");
    const payload = verifyToken(token);
    if (!payload) return fail("غير مصرح");

    const student = await db.student.findUnique({
      where: { id: studentId },
    });
    if (!student) return fail("هذا الطالب غير موجود");

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
  },
);

export const assignTutor = withResult(
  async (studentId: number, tutorId: number | null) => {
    const token = await getTokenFromCookie();
    if (!token) return fail("غير مصرح");
    const payload = verifyToken(token);
    if (!payload || !payload.academyId) return fail("غير مصرح");

    const student = await db.student.findUnique({
      where: { id: studentId },
      include: { user: { select: { id: true, name: true } } },
    });
    if (!student) return fail("الطالب غير موجود");

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
  },
);

export const addNote = withResult(
  async (studentId: number, content: string) => {
    const token = await getTokenFromCookie();
    if (!token) return fail("غير مصرح");
    const payload = verifyToken(token);
    if (!payload) return fail("غير مصرح");

    await db.note.create({
      data: {
        content,
        targetType: 0,
        targetId: studentId,
        authorId: payload.id,
      },
    });

    revalidatePath(`/ar/dashboard/students/${studentId}`);
  },
);

export const bulkAssignTutor = withResult(
  async (studentIds: number[], tutorId: number | null) => {
    const token = await getTokenFromCookie();
    if (!token) return fail("غير مصرح");
    const payload = verifyToken(token);
    if (!payload || !payload.academyId) return fail("غير مصرح");

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
  },
);

export const bulkChangeStatus = withResult(
  async (studentIds: number[], status: number) => {
    const token = await getTokenFromCookie();
    if (!token) return fail("غير مصرح");
    const payload = verifyToken(token);
    if (!payload) return fail("غير مصرح");

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
  },
);

export const bulkAddNote = withResult(
  async (studentIds: number[], content: string) => {
    const token = await getTokenFromCookie();
    if (!token) return fail("غير مصرح");
    const payload = verifyToken(token);
    if (!payload) return fail("غير مصرح");

    await db.note.createMany({
      data: studentIds.map((studentId) => ({
        content,
        targetType: 0, // student
        targetId: studentId,
        authorId: payload.id,
      })),
    });

    revalidatePath("/ar/dashboard/students");
  },
);

export const changePlan = withResult(
  async (groupStudentId: number, newPlanId: number) => {
    const token = await getTokenFromCookie();
    if (!token) return fail("غير مصرح");
    const payload = verifyToken(token);
    if (!payload) return fail("غير مصرح");

    const plan = await db.plan.findUnique({ where: { id: newPlanId } });
    if (!plan) return fail("الباقة غير موجودة");

    const groupStudent = await db.groupStudent.findUnique({
      where: { id: groupStudentId },
      include: {
        student: { select: { id: true, status: true, academyId: true } },
        subscriptions: {
          where: { status: SubscriptionStatus.active },
          orderBy: { startDate: "desc" },
          take: 1,
          select: { id: true, planId: true },
        },
      },
    });
    if (!groupStudent) return fail("الالتحاق غير موجود");

    const activeSub = groupStudent.subscriptions[0];
    if (!activeSub) return fail("لا يوجد اشتراك نشط لهذا الطالب");

    const now = dayjs().toDate();
    const endDate = dayjs().add(plan.billingPeriod, "day").toDate();

    await db.$transaction(async (tx) => {
      // Expire the current active subscription for this enrollment
      await tx.subscription.update({
        where: { id: activeSub.id },
        data: { status: SubscriptionStatus.expired, endDate: now },
      });

      // Create the new subscription row with the plan's terms
      const newSubscription = await tx.subscription.create({
        data: {
          groupStudentId: groupStudent.id,
          planId: plan.id,
          price: plan.price,
          currencyId: plan.currencyId,
          sessionCount: plan.sessionCount,
          billingCycle: plan.billingPeriod,
          startDate: now,
          endDate,
          nextBillingDate: endDate,
          status: SubscriptionStatus.active,
        },
      });

      await tx.revenue.create({
        data: {
          amount: plan.price,
          academyId: groupStudent.student.academyId,
          currencyId: plan.currencyId,
          studentId: groupStudent.student.id,
          recordedBy: payload.id,
          subscriptionId: newSubscription.id,
          planId: plan.id,
          dueDate: newSubscription.startDate,
          status: PaymentStatus.PENDING,
        },
      });

      await tx.student.update({
        where: { id: groupStudent.student.id },
        data: { status: StudentStatus.subscribed },
      });
    });

    if (groupStudent.student.status !== StudentStatus.subscribed)
      await recordStudentStatusChangeHistory(
        groupStudent.student.id,
        groupStudent.student.status,
        StudentStatus.subscribed,
        payload.id,
        groupStudent.student.academyId,
      );

    if (activeSub.planId !== newPlanId) {
      await recordStudentPlanChangeHistory(
        groupStudent.student.id,
        activeSub.planId,
        newPlanId,
        payload.id,
        groupStudent.student.academyId,
      );
    }

    revalidatePath(`/ar/dashboard/students/${groupStudent.student.id}`);
    revalidatePath("/ar/dashboard/students");
    return null;
  },
);

export const recordPayment = withResult(
  async (
    studentId: number,
    subscriptionId: number,
    amount: number,
    method: number,
    description?: string,
  ) => {
    const token = await getTokenFromCookie();
    if (!token) return fail("غير مصرح");
    const payload = verifyToken(token);
    if (!payload) return fail("غير مصرح");

    // Get subscription to find its plan's currency
    const subscription = await db.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        plan: { select: { title: true } },
        groupStudent: {
          select: { studentId: true, group: { select: { academyId: true } } },
        },
      },
    });
    if (!subscription) return fail("الاشتراك غير موجود");
    if (subscription.groupStudent.studentId !== studentId)
      return fail("الاشتراك لا ينتمي لهذا الطالب");

    const payment = await db.revenue.create({
      data: {
        amount,
        currencyId: subscription.currencyId,
        status: PaymentStatus.PAID,
        method,
        dueDate: new Date(),
        description:
          description ||
          (subscription.plan?.title
            ? `دفعة اشتراك ${subscription.plan.title}`
            : "دفعة اشتراك"),
        studentId,
        subscriptionId,
        planId: subscription.planId,
        academyId: subscription.groupStudent.group.academyId,
      },
    });

    revalidatePath(`/ar/dashboard/students/${studentId}`);
    return payment;
  },
);

export const resolvePayment = withResult(
  async (
    paymentId: number,
    method: number | null,
    invoiceUrl: string | null,
  ) => {
    const token = await getTokenFromCookie();
    if (!token) return fail("غير مصرح");
    const payload = verifyToken(token);
    if (!payload) return fail("غير مصرح");

    const payment = await db.revenue.findUnique({
      where: { id: paymentId },
      include: { student: { select: { id: true } } },
    });
    if (!payment) return fail("الدفعة غير موجودة");
    if (payment.status !== PaymentStatus.PENDING)
      return fail("يمكن فقط تسوية الدفعات المعلقة");

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
  },
);

export const renewSubscription = withResult(
  async (
    subscriptionId: number,
    opts?: { paid?: boolean; method?: number },
  ) => {
    const currentUser = await user();
    if (!currentUser || currentUser.role !== Role.Admin)
      return fail("غير مصرح");

    const subscription = await db.subscription.findUnique({
      where: { id: subscriptionId },
      select: {
        id: true,
        price: true,
        currencyId: true,
        planId: true,
        sessionCount: true,
        billingCycle: true,
        status: true,
        groupStudent: {
          select: {
            id: true,
            studentId: true,
            group: { select: { academyId: true } },
          },
        },
      },
    });
    if (!subscription) return fail("الاشتراك غير موجود");
    if (subscription.status !== SubscriptionStatus.active)
      return fail("لا يوجد اشتراك نشط للتجديد");

    const paid = opts?.paid ?? false;
    const billingDays = subscription.billingCycle || 30;
    const startDate = dayjs.utc().startOf("day").toDate();
    const endDate = dayjs.utc().startOf("day").add(billingDays, "day").toDate();

    await db.$transaction(async (tx) => {
      // Revoke the current active subscription (one active row per enrollment)
      await tx.subscription.update({
        where: { id: subscription.id },
        data: { status: SubscriptionStatus.expired, endDate: startDate },
      });

      // Create the new cycle row, preserving the agreed terms
      const sub = await tx.subscription.create({
        data: {
          groupStudentId: subscription.groupStudent.id,
          planId: subscription.planId,
          price: subscription.price,
          currencyId: subscription.currencyId,
          sessionCount: subscription.sessionCount,
          billingCycle: subscription.billingCycle,
          startDate,
          endDate,
          nextBillingDate: endDate,
          status: SubscriptionStatus.active,
        },
      });

      await tx.revenue.create({
        data: {
          amount: subscription.price,
          currencyId: subscription.currencyId,
          academyId: subscription.groupStudent.group.academyId,
          studentId: subscription.groupStudent.studentId,
          description: `تجديد إشتراك شهر ${dayjs().format("MMMM YYYY")} `,
          subscriptionId: sub.id,
          planId: subscription.planId,
          recordedBy: currentUser.id,
          dueDate: paid ? dayjs.utc().toDate() : endDate,
          status: paid ? PaymentStatus.PAID : PaymentStatus.PENDING,
        },
      });
    });

    await markStudentSubscribed(
      db,
      subscription.groupStudent.studentId,
      currentUser.id,
      subscription.groupStudent.group.academyId,
    );

    revalidatePath(
      `/ar/dashboard/students/${subscription.groupStudent.studentId}`,
    );
    revalidatePath("/ar/dashboard");
  },
);

export const getStudentSessionsForWeek = withResult(
  async (studentId: number, weekStart: string) => {
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
  },
);
