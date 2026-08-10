"use server";

import db from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import dayjs from "@/lib/dayjs";
import {
  AdminSession,
  AdminSessionParticipant,
  AttendanceStatus,
  SessionGroup,
} from "@/types/session";
import { Role } from "@/types/user";
import { getTokenFromCookie, verifyToken } from "@/lib/jwt";
import { getSessionStatus } from "@/lib/session";
import { StudentStatus } from "@/types/student";
import { recordStudentStatusChangeHistory } from "@/lib/history";
import { user } from "@/lib/auth";
import { Prisma } from "@/generated/prisma/client";
import { getRemainingSessionsForStudents } from "./studentFinances";

type CreateSessionInput = {
  groupId?: number; // for group mode
  studentId?: number; // for private mode
  tutorId: number;
  date: string;
  startTime: string;
  duration: number;
  topic?: string;
  notes?: string;
  isTrial?: boolean;
};

type GroupWithMembers = Prisma.GroupGetPayload<{
  include: {
    members: {
      where: { active: true };
      include: { student: { include: { user: true } } };
    };
    currentTutor: {
      select: {
        id: true;
        defaultSupervisorId: true;
        baseHourlyRate: true;
        baseGroupHourlyRate: true;
      };
    };
  };
}>;

type ActiveMemberStudent = GroupWithMembers["members"][number]["student"];

export async function createSession(input: CreateSessionInput) {
  const currentUser = await user();
  if (!currentUser || !currentUser.academyId) throw new Error("غير مصرح");

  // Tutor can only create sessions for themselves
  if (currentUser.role === Role.Tutor) {
    const tutor = await db.tutor.findUnique({
      where: { userId: currentUser.id },
      select: { id: true },
    });
    if (input.tutorId !== tutor?.id) {
      throw new Error("غير مصرح: يمكنك فقط إضافة حصص لنفسك");
    }
  }

  const start = dayjs.utc(input.startTime);
  const startDate = start.toDate();
  const computedEnd = start.add(input.duration, "minute").toDate();

  if (start.isBefore(dayjs()))
    throw new Error("لا يمكن أن تكون الحصة في الماضى");

  // ── Fetch group / student based on mode ─────────────────
  let group: GroupWithMembers;
  let students: ActiveMemberStudent[];
  let studentIds: number[];

  if (input.groupId) {
    group = (await db.group.findUnique({
      where: { id: input.groupId },
      include: {
        members: {
          where: { active: true },
          include: { student: { include: { user: true } } },
        },
        currentTutor: {
          select: {
            id: true,
            defaultSupervisorId: true,
            baseHourlyRate: true,
            baseGroupHourlyRate: true,
          },
        },
      },
    })) as GroupWithMembers; // Prisma returns the exact shape, cast is safe

    if (!group || group.academyId !== currentUser.academyId)
      throw new Error("المجموعة غير موجودة");
    students = group.members.map((m) => m.student);
    studentIds = students.map((s) => s.id);
  } else if (input.studentId) {
    const student = await db.student.findUnique({
      where: { id: input.studentId },
      include: { user: true },
    });
    if (!student || student.academyId !== currentUser.academyId)
      throw new Error("الطالب غير موجود");

    students = [student];
    studentIds = [student.id];

    // Find or create a private group – keep group non‑nullable
    const existingGroup = (await db.group.findFirst({
      where: {
        currentTutorId: input.tutorId,
        academyId: currentUser.academyId!,
        active: true,
      },
      include: {
        members: {
          where: { active: true },
          include: { student: { include: { user: true } } },
        },
        currentTutor: {
          select: {
            id: true,
            defaultSupervisorId: true,
            baseHourlyRate: true,
            baseGroupHourlyRate: true,
          },
        },
      },
    })) as GroupWithMembers | null;

    if (existingGroup) {
      group = existingGroup;
    } else {
      group = (await db.group.create({
        data: {
          title: `خاص - ${student.user.name}`,
          academyId: currentUser.academyId!,
          currentTutorId: input.tutorId,
        },
        include: {
          members: {
            where: { active: true },
            include: { student: { include: { user: true } } },
          },
          currentTutor: {
            select: {
              id: true,
              defaultSupervisorId: true,
              baseHourlyRate: true,
              baseGroupHourlyRate: true,
            },
          },
        },
      })) as GroupWithMembers;
    }

    // Ensure the student is an active member
    const existing = await db.groupStudent.findFirst({
      where: { groupId: group.id, studentId: input.studentId },
    });
    if (!existing) {
      await db.groupStudent.create({
        data: { groupId: group.id, studentId: input.studentId },
      });
    } else if (!existing.active) {
      await db.groupStudent.update({
        where: { id: existing.id },
        data: { active: true, leftAt: null },
      });
    }
  } else {
    throw new Error("يجب اختيار مجموعة أو طالب");
  }

  // ── Conflict check ──────────────────────────────────────
  const conflicts = await db.session.findMany({
    where: {
      OR: [
        { tutorId: input.tutorId },
        { participants: { some: { studentId: { in: studentIds } } } },
      ],
      startTime: { lt: computedEnd },
      cancelledBy: null,
    },
    include: {
      participants: { include: { student: { include: { user: true } } } },
      group: { include: { currentTutor: { include: { user: true } } } },
    },
  });

  const overlapping = conflicts.filter((s) => {
    const sEnd = dayjs(s.startTime).add(s.durationMinutes, "minute").toDate();
    return sEnd > startDate;
  });

  if (overlapping.length > 0) {
    const conflictNames = overlapping.flatMap((c) =>
      c.participants.map((p) => p.student.user.name),
    );
    throw new Error(`تعارض في المواعيد: ${conflictNames.join("، ")}`);
  }

  // ── Trial status change ─────────────────────────────────
  if (input.isTrial) {
    for (const student of students) {
      if (student.status === StudentStatus.lead) {
        await db.student.update({
          where: { id: student.id },
          data: { status: StudentStatus.trial },
        });
        recordStudentStatusChangeHistory(
          student.id,
          student.status,
          StudentStatus.trial,
          currentUser.id,
          currentUser.academyId!,
        );
      }
    }
  }

  // ── Supervisor ──────────────────────────────────────────
  const supervisorId =
    group.currentTutor.defaultSupervisorId ??
    (
      await db.supervisor.findFirst({
        where: { academyId: currentUser.academyId!, active: true },
        select: { id: true },
      })
    )?.id;
  if (!supervisorId) throw new Error("لا يوجد مشرف متاح في الأكاديمية");

  // ── Effective tutor rate ────────────────────────────────
  const isPrivate = students.length === 1;
  const effectiveRate =
    group.tutorHourlyRate ??
    (isPrivate
      ? group.currentTutor.baseHourlyRate
      : group.currentTutor.baseGroupHourlyRate) ??
    0;

  // ── Tutor zoomUrl ───────────────────────────────────────
  const tutor = await db.tutor.findUnique({
    where: { id: input.tutorId },
    select: { zoomUrl: true },
  });
  const zoomUrl = tutor?.zoomUrl ?? null;

  // ── Per-student price (frozen at scheduling) ─────────────
  const priceByStudent = new Map<number, number>();
  for (const m of group.members) {
    priceByStudent.set(
      m.studentId,
      m.customSessionPrice ?? group.studentSessionPrice ?? 0,
    );
  }
  const defaultPrice = group.studentSessionPrice ?? 0;

  // ── Create session + participants ──────────────────────
  const session = await db.$transaction(async (tx) => {
    const created = await tx.session.create({
      data: {
        startTime: startDate,
        durationMinutes: input.duration,
        groupId: group!.id,
        tutorId: input.tutorId,
        tutorRate: effectiveRate,
        supervisorId,
        academyId: currentUser.academyId!,
        topic: input.topic,
        notes: input.notes,
        isTrial: input.isTrial ?? false,
        zoomUrl,
      },
    });

    await tx.sessionParticipant.createMany({
      data: studentIds.map((studentId) => ({
        sessionId: created.id,
        studentId,
        price: input.isTrial
          ? 0
          : (priceByStudent.get(studentId) ?? defaultPrice),
        paymentStatus: 0,
      })),
    });

    return created;
  });

  revalidatePath("/ar/dashboard/sessions");
  revalidatePath("/ar/dashboard/tutor/sessions");
  return session;
}

export type UpdateSessionInput = {
  id: number;
  date?: string; // unused in logic, but passed from dialog
  startTime?: string; // ISO UTC
  duration?: number;
  topic?: string;
  notes?: string;
  isTrial?: boolean;
  tutorId?: number; // may override
};

export async function updateSession(input: UpdateSessionInput) {
  const existing = await db.session.findUnique({
    where: { id: input.id },
    include: { group: { select: { currentTutorId: true } } },
  });
  if (!existing) throw new Error("Session not found");

  const newStart = input.startTime
    ? dayjs.utc(input.startTime).toDate()
    : existing.startTime;
  const newDuration = input.duration ?? existing.durationMinutes;

  const data: Record<string, unknown> = {
    startTime: newStart,
    durationMinutes: newDuration,
    topic: input.topic,
    notes: input.notes,
    isTrial: input.isTrial,
  };
  if (input.tutorId !== undefined) data.tutorId = input.tutorId;

  await db.session.update({
    where: { id: input.id },
    data,
  });

  revalidatePath("/ar/dashboard/sessions");
}

export async function updateAttendance(
  participantId: number,
  studentStatus: AttendanceStatus,
  reason?: string,
) {
  const participant = await db.sessionParticipant.findUnique({
    where: { id: participantId },
    include: { session: true },
  });
  if (!participant) throw new Error("المشارك غير موجود");

  await db.sessionParticipant.update({
    where: { id: participantId },
    data: {
      studentAttendanceStatus: studentStatus,
      reason: reason ?? null,
    },
  });

  revalidatePath("/ar/dashboard/sessions");
  return participant;
}

export async function getSessionDetailsForManagement(
  sessionId: number,
): Promise<AdminSession | null> {
  const session = await db.session.findUnique({
    where: { id: sessionId },
    include: {
      group: { select: { id: true, title: true } },
      tutor: { select: { id: true, user: { select: { name: true } } } },
      supervisor: {
        select: { id: true, user: { select: { name: true } } },
      },
      participants: {
        include: {
          student: { select: { id: true, user: { select: { name: true } } } },
          report: true,
          homeworkSolutions: true, // if you need them for the assignment tab, otherwise can omit
        },
      },
      assignment: {
        include: {
          solutions: {
            include: {
              participant: { select: { id: true } },
            },
          },
        },
      },
      tutorAttendance: {
        include: {
          supervisor: { select: { user: { select: { name: true } } } },
        },
      },
    },
  });

  if (!session) return null;

  const endTime = dayjs(session.startTime)
    .add(session.durationMinutes, "minute")
    .toISOString();

  const participants: AdminSessionParticipant[] = session.participants.map(
    (p) => {
      const solution = session.assignment?.solutions.find(
        (s) => s.participantId === p.id,
      );
      return {
        id: p.id,
        studentId: p.studentId,
        name: p.student.user.name ?? "",
        status: p.studentAttendanceStatus, // AttendanceStatus | null
        reason: p.reason,
        price: p.price,
        paymentStatus: p.paymentStatus,
        report: p.report
          ? {
              id: p.report.id,
              rating: p.report.rating,
              outcome: p.report.outcomes, // note: field name changed from 'outcomes'
              strengths: p.report.strengths,
              weaknesses: p.report.weaknesses,
              nextGoals: p.report.nextGoals,
              comments: p.report.comments,
            }
          : null,
        homeworkSolution: solution
          ? {
              id: solution.id,
              assignmentId: solution.assignmentId,
              participantId: solution.participantId,
              fileUrl: `/api/file/solution/${solution.id}`,
              score: solution.score,
              feedback: solution.feedback,
              submittedAt: solution.submittedAt.toISOString(),
              gradedAt: solution.gradedAt?.toISOString() ?? null,
              gradedBy: solution.gradedBy,
            }
          : null,
      };
    },
  );

  return {
    id: session.id,
    startTime: session.startTime.toISOString(),
    endTime,
    durationMinutes: session.durationMinutes,
    topic: session.topic,
    isTrial: session.isTrial,
    cancelledBy: session.cancelledBy,

    status: getSessionStatus(session),

    zoomUrl: session.zoomUrl,

    groupId: session.groupId,
    groupName: session.group.title,

    tutorId: session.tutorId,
    tutorName: session.tutor.user.name ?? "",
    tutorRate: session.tutorRate,

    tutorAttendance: session.tutorAttendance
      ? {
          id: session.tutorAttendance.id,
          name: session.tutorAttendance.supervisor?.user.name ?? null,
          status: session.tutorAttendance.status,
          notes: session.tutorAttendance.notes,
          reviewedAt: session.tutorAttendance.reviewedAt?.toISOString() ?? null,
        }
      : null,

    supervisorId: session.supervisorId,
    supervisorName: session.supervisor.user.name ?? "",

    participants,
    assignment: session.assignment
      ? {
          id: session.assignment.id,
          title: session.assignment.title,
          description: session.assignment.description,
          deadline: session.assignment.deadline?.toISOString() ?? "",
          maxScore: session.assignment.maxScore,
          fileUrl: `/api/file/assignment/${session.assignment.id}`,
        }
      : null,

    createdAt: session.createdAt.toISOString(),
  };
}

export async function cancelSession(sessionId: number, cancelledBy: number) {
  const token = await getTokenFromCookie();
  if (!token) throw new Error("غير مصرح");
  const payload = verifyToken(token);
  if (!payload || !payload.academyId) throw new Error("غير مصرح");

  const session = await db.session.findUnique({
    where: { id: sessionId },
    include: { participants: true },
  });
  if (!session || session.cancelledBy !== null)
    throw new Error("لا يمكن إلغاء هذه الحصة");

  await db.session.update({
    where: { id: sessionId },
    data: { cancelledBy },
  });

  revalidatePath("/ar/dashboard/sessions");
  for (const p of session.participants) {
    revalidatePath(`/ar/dashboard/students/${p.studentId}`);
  }
}

export async function deleteSession(sessionId: number) {
  const token = await getTokenFromCookie();
  if (!token) throw new Error("غير مصرح");
  const payload = verifyToken(token);
  if (!payload || !payload.academyId) throw new Error("غير مصرح");

  const session = await db.session.findUnique({
    where: { id: sessionId },
  });
  if (!session) throw new Error("الحصة غير موجودة");
  if (session.cancelledBy !== null) throw new Error("الحصة ملغية بالفعل");

  await db.session.update({
    where: { id: sessionId },
    data: { cancelledBy: payload.id },
  });

  revalidatePath("/ar/dashboard/sessions");
}

export async function getSessionFormOptions(
  academyId: number,
  tutorId?: number,
) {
  const currentUser = await user();
  if (!currentUser || currentUser.academyId !== academyId)
    throw new Error("غير مصرح");

  const groupWhere = {
    academyId,
    active: true,
    ...(tutorId ? { currentTutorId: tutorId } : {}),
  };

  const [groups, tutors, students] = await Promise.all([
    db.group.findMany({
      where: groupWhere,
      include: {
        currentTutor: {
          select: { id: true, user: { select: { name: true } } },
        },
        members: {
          where: { active: true },
          include: {
            student: {
              select: {
                id: true,
                user: { select: { name: true } },
              },
            },
          },
        },
      },
      orderBy: { title: "asc" },
    }),
    db.tutor.findMany({
      where: {
        academyId,
        active: true,
        ...(tutorId ? { id: tutorId } : {}),
      },
      select: { id: true, user: { select: { name: true } } },
      orderBy: { user: { name: "asc" } },
    }),
    db.student.findMany({
      where: { academyId },
      select: {
        id: true,
        user: { select: { name: true } },
      },
      orderBy: { user: { name: "asc" } },
    }),
  ]);

  const remainingMap = await getRemainingSessionsForStudents(
    students.map((s) => s.id),
  );

  const groupOptions: SessionGroup[] = groups.map((g) => ({
    id: g.id,
    title: g.title,
    tutorId: g.currentTutor.id,
    tutorName: g.currentTutor.user.name ?? "",
    active: g.active,
    activeMembers: g.members.map((m) => ({
      id: m.student.id,
      name: m.student.user.name ?? "",
      sessionsRemaining: remainingMap.get(m.student.id) ?? null,
    })),
  }));

  const tutorOptions = tutors.map((t) => ({
    id: t.id,
    name: t.user.name ?? "",
  }));

  const studentOptions = students.map((s) => ({
    id: s.id,
    name: s.user.name ?? "",
    sessionsRemaining: remainingMap.get(s.id) ?? null,
  }));

  return { groups: groupOptions, tutors: tutorOptions, students: studentOptions };
}
