"use server";

import db from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import bcrypt from "bcrypt";
import { Role } from "@/types/user";
import { getTokenFromCookie, verifyToken } from "@/lib/jwt";
import { getSessionStatus } from "@/lib/session";
import dayjs from "@/lib/dayjs";
import { withResult, fail } from "@/lib/action-result";

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
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
});

export const createTutor = withResult(async (formData: FormData) => {
  const token = await getTokenFromCookie();
  if (!token) return fail("غير مصرح");
  const payload = verifyToken(token);
  if (!payload || !payload.academyId) return fail("غير مصرح");

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
    password: formData.get("password"),
  };

  const validated = createTutorSchema.safeParse(rawData);
  if (!validated.success) {
    return fail(validated.error.issues[0]?.message ?? "بيانات غير صحيحة");
  }
  const academy = await db.academy.findUnique({
    where: { id: payload.academyId },
  });
  if (!academy || academy.id !== payload.academyId) {
    return fail("الأكاديمية غير موجودة");
  }

  // Create user first
  const hashedPassword = await bcrypt.hash(validated.data.password, 10);
  await db.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: validated.data.email,
        password: hashedPassword,
        phone: validated.data.phone,
        name: validated.data.name,
        role: Role.Tutor,
        timezone: validated.data.timezone,
      },
    });
    await tx.tutor.create({
      data: {
        userId: user.id,
        academyId: payload.academyId!,
        baseHourlyRate: validated.data.privatePricePerHour,
        baseGroupHourlyRate: validated.data.groupPricePerHour,
        active: validated.data.active,
        bio: validated.data.bio,
        qualifications: validated.data.qualifications,
        zoomAuthenticated: validated.data.zoomAuthenticated,
        zoomUrl: validated.data.zoomUrl,
        currencyId: validated.data.currencyId,
        specialities: {
          connect: validated.data.specialities?.map((id) => ({ id })),
        },
      },
    });
  });

  revalidatePath("/ar/dashboard/tutors");
});

export const updateTutor = withResult(async (id: number, formData: FormData) => {
  const token = await getTokenFromCookie();
  if (!token) return fail("غير مصرح");
  const payload = verifyToken(token);
  if (!payload || !payload.academyId) return fail("غير مصرح");

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
    return fail("السعر يجب أن يكون أكبر من أو يساوي 0");

  const tutor = await db.tutor.findUnique({
    where: { id },
    select: { userId: true },
  });
  if (!tutor) return fail("المعلم غير موجود");

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
});

export const addTutorNote = withResult(async (tutorId: number, content: string) => {
  const token = await getTokenFromCookie();
  if (!token) return fail("غير مصرح");
  const payload = verifyToken(token);
  if (!payload) return fail("غير مصرح");

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
});

export const getTutorSessionsForMonth = withResult(async (
  tutorId: number,
  monthStart: string,
) => {
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
});
export const getTutorSessionsForWeek = withResult(async (
  tutorId: number,
  weekStart: string,
) => {
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
});
