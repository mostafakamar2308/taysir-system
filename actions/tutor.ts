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
        privatePricePerHour: validated.privatePricePerHour,
        groupPricePerHour: validated.groupPricePerHour,
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

const updateTutorSchema = z.object({
  name: z.string().min(1, "الاسم مطلوب"),
  email: z.string().email("بريد إلكتروني غير صالح"),
  phone: z.string().optional().nullable(),
  timezone: z.string().min(1, "المنطقة الزمنية مطلوبة"),
  privatePricePerHour: z.number().positive("يجب أن يكون أكبر من 0"),
  groupPricePerHour: z.number().positive("يجب أن يكون أكبر من 0"),
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
    privatePricePerHour: formData.get("privatePricePerHour")
      ? parseFloat(formData.get("privatePricePerHour") as string)
      : undefined,
    groupPricePerHour: formData.get("groupPricePerHour")
      ? parseFloat(formData.get("groupPricePerHour") as string)
      : undefined,
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
        privatePricePerHour: validated.privatePricePerHour,
        groupPricePerHour: validated.groupPricePerHour,
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
      endTime: s.endTime.toISOString(),
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
