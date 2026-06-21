"use server";

import db from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { user } from "@/lib/auth";
import { Role } from "@/types/user";
import { uploadFile } from "@/lib/uploadFile";
import { unlink } from "fs/promises";
import { sendSingleMessage } from "./tutor/sendMessage";

// ─── Student uploads solution ───────────────────────────────
export async function uploadSolution(
  participantId: number,
  formData: FormData,
) {
  const currentUser = await user();
  if (!currentUser || !currentUser.studentId) throw new Error("غير مصرح");

  const participant = await db.sessionParticipant.findUnique({
    where: { id: participantId },
    include: {
      student: {
        include: { user: true },
      },
      session: {
        include: {
          assignment: true,
          tutor: { select: { user: { select: { phone: true } } } },
        },
      },
    },
  });

  if (!participant) throw new Error("المشاركة غير موجودة");
  if (participant.studentId !== currentUser.studentId)
    throw new Error("غير مصرح لك برفع حل لهذه الحصة");

  if (!participant.session.assignment)
    throw new Error("لا يوجد واجب لهذه الحصة");

  // Check if solution already exists
  const existing = await db.homeworkSolution.findUnique({
    where: {
      assignmentId_participantId: {
        assignmentId: participant.session.assignment.id,
        participantId,
      },
    },
  });
  if (existing)
    throw new Error("لقد قمت برفع حل مسبقاً. احذفه أولاً أو عدّله.");

  const file = formData.get("file") as File;
  if (!file) throw new Error("الملف مطلوب");

  const upload = await uploadFile(file, "solutions");

  const solution = await db.homeworkSolution.create({
    data: {
      assignmentId: participant.session.assignment.id,
      participantId,
      filePath: upload.filePath,
      originalFileName: upload.originalFileName,
      fileSize: upload.fileSize,
      mimeType: upload.mimeType,
    },
  });

  if (participant.session.tutor?.user?.phone) {
    const studentName = participant.student.user.name ?? "طالب";
    const assignmentTitle = participant.session.assignment?.title || "الواجب";
    const message = `السلام عليكم، قام الطالب ${studentName} برفع حل لواجب "${assignmentTitle}". يرجى المراجعة.`;
    try {
      await sendSingleMessage(participant.session.tutor.user.phone, message);
    } catch (e) {
      console.error("Failed to notify tutor about solution upload:", e);
    }
  }

  revalidatePath(`/ar/dashboard/students/${participant.studentId}`);
  return solution;
}

// ─── Tutor grades a solution ────────────────────────────────
export async function gradeSolution(
  solutionId: number,
  score: number,
  feedback?: string,
) {
  const currentUser = await user();
  if (!currentUser) throw new Error("غير مصرح");

  const solution = await db.homeworkSolution.findUnique({
    where: { id: solutionId },
    include: {
      assignment: {
        include: { session: { select: { tutorId: true, academyId: true } } },
      },
    },
  });

  if (!solution) throw new Error("الحل غير موجود");

  const isTutor = currentUser.tutorId === solution.assignment.session.tutorId;
  const isAdmin = currentUser.role === Role.Admin;
  if (!isTutor && !isAdmin) throw new Error("غير مصرح بالتقييم");

  if (score < 0 || score > (solution.assignment.maxScore || 10)) {
    throw new Error("الدرجة خارج النطاق المسموح");
  }

  await db.homeworkSolution.update({
    where: { id: solutionId },
    data: {
      score,
      feedback,
      gradedAt: new Date(),
      gradedBy: currentUser.id,
    },
  });

  const solutionWithStudent = await db.homeworkSolution.findUnique({
    where: { id: solutionId },
    include: {
      participant: {
        include: {
          student: {
            select: { user: { select: { phone: true, name: true } } },
          },
        },
      },
      assignment: { select: { title: true, maxScore: true } },
    },
  });

  if (solutionWithStudent?.participant.student.user.phone) {
    const studentName =
      solutionWithStudent.participant.student.user.name ?? "طالب";
    const assignmentTitle = solutionWithStudent.assignment?.title || "الواجب";
    const message = `السلام عليكم ${studentName}، تم تصحيح واجب "${assignmentTitle}". نتيجتك: ${score}/${solutionWithStudent.assignment.maxScore}. ${feedback ? `ملاحظات: ${feedback}` : ""}`;
    try {
      await sendSingleMessage(
        solutionWithStudent.participant.student.user.phone,
        message,
      );
    } catch (e) {
      console.error("Failed to notify student about graded solution:", e);
    }
  }

  revalidatePath("/ar/dashboard/tutor/sessions");
}

// ─── Delete solution (student or tutor) ────────────────────
export async function deleteSolution(solutionId: number) {
  const currentUser = await user();
  if (!currentUser) throw new Error("غير مصرح");

  const solution = await db.homeworkSolution.findUnique({
    where: { id: solutionId },
    include: {
      participant: { select: { studentId: true } },
      assignment: { include: { session: { select: { tutorId: true } } } },
    },
  });

  if (!solution) throw new Error("الحل غير موجود");

  const isOwner = currentUser.studentId === solution.participant.studentId;
  const isTutor = currentUser.tutorId === solution.assignment.session.tutorId;
  const isAdmin = currentUser.role === Role.Admin;

  if (!isOwner && !isTutor && !isAdmin) throw new Error("غير مصرح");

  // Delete file
  try {
    await unlink(solution.filePath);
  } catch (e) {
    console.error("File delete error:", e);
  }

  await db.homeworkSolution.delete({ where: { id: solutionId } });

  revalidatePath("/ar/dashboard");
}
