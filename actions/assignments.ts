"use server";

import db from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { user } from "@/lib/auth";
import { Role } from "@/types/user";
import { uploadFile } from "@/lib/uploadFile";
import { unlink } from "fs/promises";
import { sendSingleMessage } from "./tutor/sendMessage";

// ─── Tutor/Admin upload assignment ──────────────────────────
export async function uploadAssignment(sessionId: number, formData: FormData) {
  const currentUser = await user();
  if (!currentUser || !currentUser.academyId) throw new Error("غير مصرح");

  const session = await db.session.findUnique({
    where: { id: sessionId },
    select: { tutorId: true, academyId: true },
  });
  if (!session || session.academyId !== currentUser.academyId)
    throw new Error("الحصة غير موجودة");

  const isTutor =
    currentUser.role === Role.Tutor && currentUser.tutorId === session.tutorId;
  const isAdmin = currentUser.role === Role.Admin;
  if (!isTutor && !isAdmin) throw new Error("غير مصرح");

  const file = formData.get("file") as File;
  if (!file) throw new Error("الملف مطلوب");

  const title = formData.get("title") as string | null;
  const description = formData.get("description") as string | null;
  const deadline = formData.get("deadline") as string | null;
  const maxScore = formData.get("maxScore")
    ? parseInt(formData.get("maxScore") as string)
    : 10;

  // Check existing assignment
  const existing = await db.assignment.findUnique({ where: { sessionId } });
  if (existing) throw new Error("يوجد واجب بالفعل لهذه الحصة. احذفه أولاً.");

  const upload = await uploadFile(file, "assignments");

  await db.assignment.create({
    data: {
      sessionId,
      title,
      description,
      deadline: deadline ? new Date(deadline) : null,
      maxScore,
      filePath: upload.filePath,
      originalFileName: upload.originalFileName,
      fileSize: upload.fileSize,
      mimeType: upload.mimeType,
    },
  });

  const participants = await db.sessionParticipant.findMany({
    where: { sessionId },
    include: {
      student: { select: { user: { select: { phone: true, name: true } } } },
    },
  });

  for (const p of participants) {
    const phone = p.student.user.phone;
    if (!phone) continue;
    const studentName = p.student.user.name ?? "طالب";
    const message = `السلام عليكم ${studentName}، تم رفع واجب جديد لحصتك بعنوان "${title || "بدون عنوان"}". يمكنك رفع الحل من حسابك.`;
    try {
      await sendSingleMessage(phone, message);
    } catch (e) {
      console.error("Failed to notify student about new assignment:", e);
    }
  }

  revalidatePath("/ar/dashboard/sessions");
}

// ─── Delete assignment (tutor/admin) ────────────────────────
export async function deleteAssignment(sessionId: number) {
  const currentUser = await user();
  if (!currentUser || !currentUser.academyId) throw new Error("غير مصرح");

  const session = await db.session.findUnique({
    where: { id: sessionId },
    select: { tutorId: true, academyId: true, assignment: true },
  });
  if (!session || session.academyId !== currentUser.academyId)
    throw new Error("الحصة غير موجودة");

  const isTutor =
    currentUser.role === Role.Tutor && currentUser.tutorId === session.tutorId;
  const isAdmin = currentUser.role === Role.Admin;
  if (!isTutor && !isAdmin) throw new Error("غير مصرح");

  if (!session.assignment) throw new Error("لا يوجد واجب لهذه الحصة");

  // Delete file from disk
  try {
    await unlink(session.assignment.filePath);
  } catch (e) {
    console.error("File not found on disk:", e);
  }

  await db.assignment.delete({ where: { sessionId } });

  revalidatePath("/ar/dashboard/sessions");
}

export type AssignmentWithSolutions = NonNullable<
  Awaited<ReturnType<typeof getAssignmentForSession>>
>;

export async function getAssignmentForSession(sessionId: number) {
  const currentUser = await user();
  if (!currentUser || !currentUser.academyId) throw new Error("غير مصرح");

  const assignment = await db.assignment.findUnique({
    where: { sessionId },
    include: {
      solutions: {
        include: {
          participant: {
            include: {
              student: { select: { user: { select: { name: true } } } },
            },
          },
        },
      },
    },
  });

  if (!assignment) return null; // no assignment yet

  // Optionally verify session belongs to academy
  const session = await db.session.findUnique({
    where: { id: sessionId },
    select: { academyId: true, tutorId: true },
  });
  if (!session || session.academyId !== currentUser.academyId)
    throw new Error("غير مصرح");

  return {
    id: assignment.id,
    title: assignment.title,
    description: assignment.description,
    deadline: assignment.deadline?.toISOString() ?? null,
    maxScore: assignment.maxScore,
    filePath: assignment.filePath,
    originalFileName: assignment.originalFileName,
    mimeType: assignment.mimeType,
    solutions: assignment.solutions.map((sol) => ({
      id: sol.id,
      participantId: sol.participantId,
      studentName: sol.participant.student.user.name ?? "طالب",
      filePath: sol.filePath,
      originalFileName: sol.originalFileName,
      score: sol.score,
      feedback: sol.feedback,
      submittedAt: sol.submittedAt.toISOString(),
      gradedAt: sol.gradedAt?.toISOString() ?? null,
    })),
  };
}

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

  if (score < 0 || score > (solution.assignment.maxScore || 10))
    throw new Error("الدرجة خارج النطاق");

  await db.homeworkSolution.update({
    where: { id: solutionId },
    data: { score, feedback, gradedAt: new Date(), gradedBy: currentUser.id },
  });

  revalidatePath("/ar/dashboard/tutor/sessions");
}
