"use server";

import db from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import bcrypt from "bcrypt";
import { Role } from "@/types/user";
import { getTokenFromCookie, verifyToken } from "@/lib/jwt";
import { getSessionStatus } from "@/lib/session";
import dayjs from "@/lib/dayjs";
import { TutorSession } from "@/types/tutor";

const createTutorSchema = z.object({
  name: z.string().min(1, "الاسم مطلوب"),
  email: z.string().email("بريد إلكتروني غير صالح"),
  phone: z.string().min(1, "رقم الهاتف مطلوب"),
  timezone: z.string().min(1, "المنطقة الزمنية مطلوبة"),
  pricePerSession: z.number().min(0, "السعر يجب أن يكون 0 أو أكثر"),
  specialities: z.array(z.number()).optional(),
  active: z.boolean().default(true),
  bio: z.string().optional().nullable(),
  qualifications: z.string().optional().nullable(),
  zoomUrl: z.string().optional().nullable(),
  zoomAuthenticated: z.boolean().default(false),
  currencyId: z.number(),
  academyId: z.number(),
});

export async function createTutor(formData: FormData) {
  const token = await getTokenFromCookie();
  if (!token) throw new Error("غير مصرح");
  const payload = verifyToken(token);
  if (!payload) throw new Error("غير مصرح");

  const specialitiesStr = formData.get("specialities") as string;
  const specialities = specialitiesStr
    ? specialitiesStr.split(",").map(Number)
    : [];

  const rawData = {
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    timezone: formData.get("timezone"),
    pricePerSession: formData.get("pricePerSession")
      ? parseFloat(formData.get("pricePerSession") as string)
      : undefined,
    specialities,
    active: formData.get("active") === "on",
    bio: formData.get("bio") || null,
    qualifications: formData.get("qualifications") || null,
    currencyId: parseInt(formData.get("currencyId") as string),
    zoomAuthenticated: formData.get("zoomAuthenticated") === "on",
    zoomUrl: formData.get("zoomUrl"),
    academyId: parseInt(formData.get("academyId") as string),
  };

  const validated = createTutorSchema.parse(rawData);

  const academy = await db.academy.findUnique({
    where: { id: validated.academyId },
  });
  if (!academy) {
    throw new Error("Academy not found");
  }

  // Create user first
  const hashedPassword = await bcrypt.hash("default123", 10);
  const user = await db.user.create({
    data: {
      email: validated.email,
      password: hashedPassword,
      name: validated.name,
      role: Role.Tutor,
      timezone: validated.timezone,
    },
  });

  await db.tutor.create({
    data: {
      userId: user.id,
      academyId: validated.academyId,
      pricePerSession: validated.pricePerSession,
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

  revalidatePath("/ar/dashboard/tutors");
}

const updateTutorSchema = z.object({
  name: z.string().min(1, "الاسم مطلوب"),
  email: z.string().email("بريد إلكتروني غير صالح"),
  phone: z.string().optional().nullable(),
  timezone: z.string().min(1, "المنطقة الزمنية مطلوبة"),
  pricePerSession: z.number().positive("سعر الحصة يجب أن يكون أكبر من 0"),
  bio: z.string().optional().nullable(),
  qualifications: z.string().optional().nullable(),
  active: z.boolean(),
  zoomAuthenticated: z.boolean().optional(),
  zoomUrl: z.string().optional().nullable(),
});

export async function updateTutor(id: number, formData: FormData) {
  const token = await getTokenFromCookie();
  if (!token) throw new Error("غير مصرح");
  const payload = verifyToken(token);
  if (!payload) throw new Error("غير مصرح");

  const rawData = {
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") || null,
    timezone: formData.get("timezone"),
    pricePerSession: parseFloat(formData.get("pricePerSession") as string),
    bio: formData.get("bio") || null,
    qualifications: formData.get("qualifications") || null,
    active: formData.get("active") === "true",
    zoomAuthenticated: formData.get("zoomAuthenticated") === "true",
    zoomUrl: formData.get("zoomUrl") || null,
  };

  const validated = updateTutorSchema.parse(rawData);

  // Update user and tutor in transaction
  await db.$transaction([
    db.user.update({
      where: {
        id: (
          await db.tutor.findUnique({ where: { id }, select: { userId: true } })
        )?.userId,
      },
      data: {
        name: validated.name,
        email: validated.email,
        phone: validated.phone,
        timezone: validated.timezone,
      },
    }),
    db.tutor.update({
      where: { id },
      data: {
        pricePerSession: validated.pricePerSession,
        bio: validated.bio,
        qualifications: validated.qualifications,
        active: validated.active,
        zoomAuthenticated: validated.zoomAuthenticated,
        zoomUrl: validated.zoomUrl,
      },
    }),
  ]);

  revalidatePath(`/ar/dashboard/tutors/${id}`);
  revalidatePath("/ar/dashboard/tutors");
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
      student: true,
      attendance: true,
      sessionReport: true,
    },
    orderBy: { startTime: "desc" },
  });

  return sessions.map((s) => ({
    id: s.id,
    startTime: s.startTime.toISOString(),
    endTime: s.endTime.toISOString(),
    durationMinutes: s.durationMinutes,
    status: getSessionStatus(s),
    topic: s.topic,
    studentId: s.studentId,
    studentName: s.student.name,
    attendance: s.attendance
      ? {
          id: s.attendance.id,
          tutorAttendance: s.attendance.tutorAttendanceStatus,
          studentAttendance: s.attendance.studentAttendanceStatus,
          reason: s.attendance.reason,
        }
      : undefined,
    report: s.sessionReport
      ? {
          id: s.sessionReport.id,
          outcomes: s.sessionReport.outcomes,
          strengths: s.sessionReport.strengths,
          weaknesses: s.sessionReport.weaknesses,
          nextGoals: s.sessionReport.nextGoals,
          comments: s.sessionReport.comments,
          rating: s.sessionReport.rating,
        }
      : undefined,
  }));
}
