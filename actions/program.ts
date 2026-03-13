"use server";

import db from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Validation schemas
const programSchema = z.object({
  name: z.string().min(1, "الاسم مطلوب"),
  description: z.string().optional().nullable(),
  level: z.string().optional().nullable(),
  duration: z.number().int().positive().optional().nullable(),
  academyId: z.number(),
});

const topicSchema = z.object({
  programId: z.number(),
  title: z.string().min(1, "عنوان الموضوع مطلوب"),
  description: z.string().optional().nullable(),
  order: z.number().int().min(0),
});

// ---------- Programs ----------
export async function createProgram(formData: FormData) {
  const rawData = {
    name: formData.get("name"),
    description: formData.get("description") || null,
    level: formData.get("level") || null,
    duration: formData.get("duration")
      ? parseInt(formData.get("duration") as string)
      : null,
    academyId: parseInt(formData.get("academyId") as string),
  };
  const validated = programSchema.parse(rawData);
  await db.program.create({ data: validated });
  revalidatePath("/programs");
}

export async function updateProgram(id: number, formData: FormData) {
  const rawData = {
    name: formData.get("name"),
    description: formData.get("description") || null,
    level: formData.get("level") || null,
    duration: formData.get("duration")
      ? parseInt(formData.get("duration") as string)
      : null,
    academyId: parseInt(formData.get("academyId") as string),
  };
  const validated = programSchema.partial().parse(rawData);
  await db.program.update({ where: { id }, data: validated });
  revalidatePath("/programs");
  revalidatePath(`/programs/${id}`);
}

export async function deleteProgram(id: number) {
  await db.program.delete({ where: { id } });
  revalidatePath("/programs");
}

// ---------- Topics ----------
export async function createTopic(formData: FormData) {
  const rawData = {
    programId: parseInt(formData.get("programId") as string),
    title: formData.get("title"),
    description: formData.get("description") || null,
    order: parseInt(formData.get("order") as string),
  };
  const validated = topicSchema.parse(rawData);
  await db.programTopic.create({ data: validated });
  revalidatePath(`/programs/${validated.programId}`);
}

export async function updateTopic(id: number, formData: FormData) {
  const rawData = {
    title: formData.get("title"),
    description: formData.get("description") || null,
    order: parseInt(formData.get("order") as string),
  };
  const validated = topicSchema.partial().parse(rawData);
  await db.programTopic.update({ where: { id }, data: validated });
  revalidatePath(`/programs/${formData.get("programId")}`);
}

export async function deleteTopic(id: number, programId: number) {
  await db.programTopic.delete({ where: { id } });
  revalidatePath(`/programs/${programId}`);
}

export async function reorderTopics(
  programId: number,
  topicOrders: { id: number; order: number }[],
) {
  const updates = topicOrders.map(({ id, order }) =>
    db.programTopic.update({ where: { id }, data: { order } }),
  );
  await db.$transaction(updates);
  revalidatePath(`/programs/${programId}`);
}

// ---------- Enrollments ----------
export async function enrollStudent(studentId: number, programId: number) {
  // Check if already enrolled
  const existing = await db.studentProgramEnrollment.findFirst({
    where: { studentId, programId },
  });
  if (existing) throw new Error("الطالب مسجل بالفعل في هذا البرنامج");

  const enrollment = await db.studentProgramEnrollment.create({
    data: {
      studentId,
      programId,
      status: 0,
      enrolledAt: new Date(),
    },
  });

  // Create progress records for all topics
  const topics = await db.programTopic.findMany({ where: { programId } });
  await db.studentTopicProgress.createMany({
    data: topics.map((topic) => ({
      enrollmentId: enrollment.id,
      topicId: topic.id,
      completed: false,
    })),
  });

  revalidatePath(`/students/${studentId}`);
  revalidatePath(`/programs/${programId}`);
}

export async function updateEnrollmentStatus(id: number, status: number) {
  await db.studentProgramEnrollment.update({
    where: { id },
    data: { status, completedAt: status === 1 ? new Date() : null },
  });
  revalidatePath(`/programs/${id}`);
}

export async function markTopicProgress(
  progressId: number,
  completed: boolean,
  notes?: string,
  sessionId?: number,
) {
  await db.studentTopicProgress.update({
    where: { id: progressId },
    data: {
      completed,
      completedAt: completed ? new Date() : null,
      notes,
      sessionId,
    },
  });
  revalidatePath(`/students/${sessionId}`); // rough, but we'll revalidate in UI
}
