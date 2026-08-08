"use server";

import db from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import bcrypt from "bcrypt";
import { Role } from "@/types/user";
import { getTokenFromCookie, verifyToken } from "@/lib/jwt";
import { getSessionStatus } from "@/lib/session";
import dayjs from "@/lib/dayjs";
import { TutorSession, TutorSessionCardData } from "@/types/tutor";

const createTutorSchema = z.object({
  name: z.string().min(1, "الاسم مطلوب"),
  email: z.string().email("بريد إلكتروني غير صالح"),
  phone: z.string().min(1, "رقم الهاتف مطلوب"),
  timezone: z.string().min(1, "المنطقة الزمنية مطلوبة"),
  privatePricePerHour: z
    .number()
    .min(0, "سعر الحصة الفردية يجب أن يكون 0 أو أكثر"),
  groupPricePerHour: z
    .number()
    .min(0, "سعر الحصة الجماعية يجب أن يكون 0 أو أكثر"),
  specialities: z.array(z.number()).optional(),
  active: z.boolean().default(true),
  bio: z.string().optional().nullable(),
  qualifications: z.string().optional().nullable(),
  zoomUrl: z.string().optional().nullable(),
  zoomAuthenticated: z.boolean().default(false),
  currencyId: z.number(),
});

export async function createTutor(formData: FormData) {
  const token = await getTokenFromCookie();
  if (!token) throw new Error("غير مصرح");
  const payload = verifyToken(token);
  if (!payload || !payload.academyId) throw new Error("غير مصرح");

  const specialitiesStr = formData.get("specialities") as string;
  const specialities = specialitiesStr
    ? specialitiesStr.split(",").map(Number)
    : [];

  const rawData = {
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    timezone: formData.get("timezone"),
    privatePricePerHour: formData.get("privatePricePerHour")
      ? parseFloat(formData.get("privatePricePerHour") as string)
      : undefined,
    groupPricePerHour: formData.get("groupPricePerHour")
      ? parseFloat(formData.get("groupPricePerHour") as string)
      : undefined,
    specialities,
    active: formData.get("active") === "on",
    bio: formData.get("bio") || null,
    qualifications: formData.get("qualifications") || null,
    currencyId: parseInt(formData.get("currencyId") as string),
    zoomAuthenticated: formData.get("zoomAuthenticated") === "on",
    zoomUrl: formData.get("zoomUrl"),
  };

  const validated = createTutorSchema.parse(rawData);

  const academy = await db.academy.findUnique({
    where: { id: payload.academyId },
  });
  if (!academy || academy.id !== payload.academyId) {
    throw new Error("Academy not found");
  }

  // Create user first
  const hashedPassword = await bcrypt.hash("default123", 10);
  await db.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: validated.email,
        password: hashedPassword,
        phone: validated.phone,
        name: validated.name,
        role: Role.Tutor,
        timezone: validated.timezone,
      },
    });
    await tx.tutor.create({
      data: {
        userId: user.id,
        academyId: payload.academyId!,
        baseHourlyRate: validated.privatePricePerHour,
        baseGroupHourlyRate: validated.groupPricePerHour,
        active: validated.active,
        bio: validated.bio,
        qualifications: validated.qualifications,
        zoomAuthenticated: validated.zoomAuthenticated,
        zoomUrl: validated.zoomUrl,
        currencyId: validated.currencyId,
        specialities: {
          connect: validated.specialities?.map((id) => ({ id })),
        },
      },
    });
  });

  revalidatePath("/ar/dashboard/tutors");
}

export async function updateTutor(id: number, formData: FormData) {
  const token = await getTokenFromCookie();
  if (!token) throw new Error("غير مصرح");
  const payload = verifyToken(token);
  if (!payload || !payload.academyId) throw new Error("غير مصرح");

  const rawData = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    phone: formData.get("phone") as string | null,
    timezone: formData.get("timezone") as string,
    baseHourlyRate: parseFloat(formData.get("baseHourlyRate") as string),
    baseGroupHourlyRate: parseFloat(
      formData.get("baseGroupHourlyRate") as string,
    ),
    bio: formData.get("bio") as string | null,
    qualifications: formData.get("qualifications") as string | null,
    active: formData.get("active") === "true",
    zoomUrl: (formData.get("zoomUrl") as string) || null,
  };

  if (rawData.baseHourlyRate < 0 || rawData.baseGroupHourlyRate < 0)
    throw new Error("السعر يجب أن يكون أكبر من أو يساوي 0");

  const tutor = await db.tutor.findUnique({
    where: { id },
    select: { userId: true },
  });
  if (!tutor) throw new Error("المعلم غير موجود");

  await db.$transaction([
    db.user.update({
      where: { id: tutor.userId },
      data: {
        name: rawData.name,
        email: rawData.email,
        phone: rawData.phone,
        timezone: rawData.timezone,
      },
    }),
    db.tutor.update({
      where: { id },
      data: {
        baseHourlyRate: rawData.baseHourlyRate,
        baseGroupHourlyRate: rawData.baseGroupHourlyRate,
        bio: rawData.bio,
        qualifications: rawData.qualifications,
        active: rawData.active,
        zoomUrl: rawData.zoomUrl,
        zoomAuthenticated: !!rawData.zoomUrl,
      },
    }),
  ]);

  revalidatePath(`/ar/dashboard/tutors/${id}`);
}

export async function addTutorNote(tutorId: number, content: string) {
  const token = await getTokenFromCookie();
  if (!token) throw new Error("غير مصرح");
  const payload = verifyToken(token);
  if (!payload) throw new Error("غير مصرح");

  await db.note.create({
    data: {
      content,
      targetType: Role.Tutor,
      targetId: tutorId,
      tutorId,
      authorId: payload.id,
    },
  });

  revalidatePath(`/ar/dashboard/tutors/${tutorId}`);
}

export async function getTutorSessionsForMonth(
  tutorId: number,
  monthStart: string,
): Promise<TutorSession[]> {
  const start = dayjs.utc(monthStart).startOf("month").toDate();
  const end = dayjs.utc(monthStart).endOf("month").toDate();

  const sessions = await db.session.findMany({
    where: {
      tutorId,
      startTime: { gte: start, lte: end },
    },
    include: {
      participants: {
        include: {
          student: { include: { user: { select: { name: true } } } },
          report: true,
        },
      },
    },
    orderBy: { startTime: "desc", createdAt: "desc" },
  });

  // Flatten: one row per student per session
  return sessions.flatMap((s) =>
    s.participants.map((p) => ({
      sessionId: s.id,
      participantId: p.id,
      startTime: s.startTime.toISOString(),
      endTime: dayjs(s.startTime)
        .add(s.durationMinutes, "minute")
        .toISOString(),
      durationMinutes: s.durationMinutes,
      status: getSessionStatus(s),
      topic: s.topic,
      studentId: p.studentId,
      studentName: p.student.user.name ?? "",
      attendance: {
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
    })),
  );
}
export async function getTutorSessionsForWeek(
  tutorId: number,
  weekStart: string,
): Promise<TutorSessionCardData[]> {
  const start = dayjs(weekStart).startOf("day"); // Saturday
  const end = start.add(7, "day");

  const sessions = await db.session.findMany({
    where: {
      tutorId,
      startTime: { gte: start.toDate(), lt: end.toDate() },
    },
    include: {
      group: { select: { title: true } },
      participants: {
        include: { report: true, homeworkSolutions: true },
      },
      assignment: { include: { solutions: true } },
    },
    orderBy: { startTime: "asc" },
  });

  return sessions.map((s) => {
    const attendanceCount = s.participants.filter(
      (p) => p.studentAttendanceStatus !== null,
    ).length;
    const reportCount = s.participants.filter((p) => p.report).length;
    const homeworkSubmissions = s.participants.filter(
      (p) => p.homeworkSolutions.length > 0,
    ).length;
    const homeworkGraded =
      s.assignment?.solutions.filter((sol) => sol.score !== null).length ?? 0;
    return {
      id: s.id,
      sessionId: s.id,
      startTime: s.startTime.toISOString(),
      endTime: dayjs(s.startTime)
        .add(s.durationMinutes, "minute")
        .toISOString(),
      durationMinutes: s.durationMinutes,
      status: getSessionStatus(s),
      topic: s.topic,
      groupName: s.group.title,
      isCompleted: s.startTime < new Date() && !s.cancelledBy,
      attendanceCount,
      totalParticipants: s.participants.length,
      reportCount,
      homeworkSubmissions,
      homeworkGraded,
      isTrial: s.isTrial,
      notes: s.notes,
      hasAssignment: !!s.assignment,
    };
  });
}
