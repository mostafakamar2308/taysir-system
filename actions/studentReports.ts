"use server";

import db from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { user } from "@/lib/auth";
import { Role } from "@/types/user";
import { uploadFile } from "@/lib/uploadFile";
import { unlink } from "fs/promises";
import { withResult, fail } from "@/lib/action-result";
import { sendSingleMessage } from "./tutor/sendMessage";
import { sendPushNotification } from "@/lib/notifications";

type Reporter = {
  id: number;
  role: number;
  tutorId?: number;
};

// Returns the student a tutor/supervisor is allowed to write reports for,
// or null when the acting user is not authorized.
async function authorizeReporter(
  acting: Reporter,
  studentId: number,
): Promise<{
  id: number;
  academyId: number;
  userId: number;
  name: string;
  phone: string | null;
  preferredLanguage: string;
} | null> {
  if (acting.role !== Role.Tutor && acting.role !== Role.Supervisor) {
    return null;
  }

  const student = await db.student.findUnique({
    where: { id: studentId },
    select: {
      id: true,
      academyId: true,
      user: {
        select: {
          id: true,
          name: true,
          phone: true,
          preferredLanguage: true,
        },
      },
    },
  });
  if (!student) return null;

  const isSupervisor =
    acting.role === Role.Supervisor &&
    (await db.supervisor.findFirst({ where: { userId: acting.id } }))?.academyId ===
      student.academyId;

  const isTutor =
    acting.role === Role.Tutor &&
    !!acting.tutorId &&
    (await db.groupStudent.findFirst({
      where: {
        studentId,
        group: { currentTutorId: acting.tutorId },
      },
      select: { id: true },
    }));

  if (!isSupervisor && !isTutor) return null;

  return {
    id: student.id,
    academyId: student.academyId,
    userId: student.user.id,
    name: student.user.name ?? "الطالب",
    phone: student.user.phone,
    preferredLanguage: student.user.preferredLanguage || "ar",
  };
}

async function notifyStudent(
  student: {
    userId: number;
    phone: string | null;
    name: string;
    preferredLanguage: string;
  },
  reportTitle: string,
  isUpdate: boolean,
) {
  const locale = student.preferredLanguage || "ar";
  const pushTitle = isUpdate
    ? "تم تحديث تقريرك"
    : "تقرير جديد لك";

  // Push notification (opens the student portal on click)
  try {
    await sendPushNotification(student.userId, {
      title: pushTitle,
      body: reportTitle,
      url: `/${locale}/dashboard/student`,
    });
  } catch (e) {
    console.error("Failed to send push notification:", e);
  }

  // WhatsApp message to the student's phone (optional channel)
  if (student.phone) {
    const content = isUpdate
      ? `السلام عليكم${student.name !== "الطالب" ? ` ${student.name}` : ""}،\nتم تحديث التقرير: "${reportTitle}".\nيمكنك الاطلاع عليه من منصة الطالب.`
      : `السلام عليكم${student.name !== "الطالب" ? ` ${student.name}` : ""}،\nتم إضافة تقرير جديد لك: "${reportTitle}".\nيمكنك الاطلاع عليه من منصة الطالب.`;
    try {
      await sendSingleMessage(student.phone, content);
    } catch (e) {
      console.error("Failed to send WhatsApp report notification:", e);
    }
  }
}

async function getFileError(err: unknown): Promise<string> {
  return err instanceof Error && err.message
    ? err.message
    : "حدث خطأ أثناء رفع الملف";
}

export const createStudentReport = withResult(
  async (studentId: number, formData: FormData) => {
    const currentUser = await user();
    if (!currentUser) return fail("غير مصرح");

    const student = await authorizeReporter(currentUser, studentId);
    if (!student) return fail("غير مصرح");

    const title = String(formData.get("title") ?? "").trim();
    if (!title) return fail("العنوان مطلوب");

    const content = String(formData.get("content") ?? "").trim() || null;
    const file = (formData.get("file") as File | null) ?? null;

    if (!content && (!file || file.size === 0)) {
      return fail("أضف نصاً أو ارفع ملف PDF واحداً على الأقل");
    }

    let upload:
      | { filePath: string; originalFileName: string; fileSize: number; mimeType: string }
      | null = null;
    if (file && file.size > 0) {
      try {
        upload = await uploadFile(file, "student-reports");
      } catch (e) {
        return fail(await getFileError(e));
      }
    }

    const report = await db.studentReport.create({
      data: {
        studentId: student.id,
        academyId: student.academyId,
        title,
        content,
        filePath: upload?.filePath ?? null,
        originalFileName: upload?.originalFileName ?? null,
        fileSize: upload?.fileSize ?? null,
        mimeType: upload?.mimeType ?? null,
        createdById: currentUser.id,
      },
    });

    await notifyStudent(student, report.title, false);

    revalidatePath(`/ar/dashboard/students/${student.id}`);
    revalidatePath("/ar/dashboard/student");
    return report;
  },
);

export const updateStudentReport = withResult(
  async (reportId: number, formData: FormData) => {
    const currentUser = await user();
    if (!currentUser) return fail("غير مصرح");

    const report = await db.studentReport.findUnique({
      where: { id: reportId },
    });
    if (!report) return fail("التقرير غير موجود");

    const student = await authorizeReporter(currentUser, report.studentId);
    if (!student) return fail("غير مصرح");

    const title = String(formData.get("title") ?? "").trim();
    if (!title) return fail("العنوان مطلوب");

    const content = String(formData.get("content") ?? "").trim() || null;
    const file = (formData.get("file") as File | null) ?? null;

    if (!content && !report.filePath && (!file || file.size === 0)) {
      return fail("أضف نصاً أو ارفع ملف PDF واحداً على الأقل");
    }

    let upload = null;
    if (file && file.size > 0) {
      try {
        upload = await uploadFile(file, "student-reports");
      } catch (e) {
        return fail(await getFileError(e));
      }
    }

    const updated = await db.studentReport.update({
      where: { id: reportId },
      data: {
        title,
        content,
        filePath: upload?.filePath ?? report.filePath,
        originalFileName: upload?.originalFileName ?? report.originalFileName,
        fileSize: upload?.fileSize ?? report.fileSize,
        mimeType: upload?.mimeType ?? report.mimeType,
        updatedById: currentUser.id,
      },
    });

    // Remove the replaced file (if a new one was uploaded)
    if (upload && report.filePath) {
      try {
        await unlink(report.filePath);
      } catch (e) {
        console.error("Failed to delete replaced report file:", e);
      }
    }

    await notifyStudent(student, updated.title, true);

    revalidatePath(`/ar/dashboard/students/${student.id}`);
    revalidatePath("/ar/dashboard/student");
    return updated;
  },
);