"use server";

import db from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { user } from "@/lib/auth";
import type { TutorOption, StudentOption } from "@/types/group";

async function ensureAdmin() {
  const currentUser = await user();
  if (!currentUser || !currentUser.academyId) return null;
  return currentUser;
}

// Fetch all active tutors for the academy (for dropdowns)
export async function getAcademyTutors(): Promise<TutorOption[]> {
  const admin = await ensureAdmin();

  const academyId = admin?.academyId;
  if (!academyId) return [];
  const tutors = await db.tutor.findMany({
    where: { academyId, active: true },
    select: {
      id: true,
      user: { select: { name: true } },
      baseGroupHourlyRate: true,
    },
    orderBy: { user: { name: "asc" } },
  });
  return tutors.map((t) => ({
    id: t.id,
    name: t.user.name ?? "",
    baseGroupHourlyRate: t.baseGroupHourlyRate,
  }));
}

// Fetch all students for the academy (for add to group)
export async function getAcademyStudents(): Promise<StudentOption[]> {
  const admin = await ensureAdmin();
  const academyId = admin?.academyId;
  if (!academyId) return [];
  const students = await db.student.findMany({
    where: { academyId },
    select: { id: true, user: { select: { name: true } } },
    orderBy: { user: { name: "asc" } },
  });
  return students.map((s) => ({ id: s.id, name: s.user.name ?? "" }));
}

// Create group
export async function createGroup(formData: FormData) {
  const admin = await ensureAdmin();
  const academyId = admin?.academyId;
  if (!academyId) throw new Error("غير مصرح");

  const title = formData.get("title") as string;
  const tutorId = parseInt(formData.get("tutorId") as string);
  const tutorHourlyRateStr = formData.get("tutorHourlyRate") as string | null;
  const tutorHourlyRate = tutorHourlyRateStr
    ? parseFloat(tutorHourlyRateStr)
    : null;

  if (!title || !tutorId) throw new Error("العنوان والمعلم مطلوبان");

  await db.group.create({
    data: {
      title,
      academyId,
      currentTutorId: tutorId,
      tutorHourlyRate,
    },
  });

  revalidatePath("/ar/dashboard/groups");
}

// Update group (title, tutor, rate)
export async function updateGroup(groupId: number, formData: FormData) {
  const admin = await ensureAdmin();
  const academyId = admin?.academyId;
  if (!academyId) throw new Error("غير مصرح");

  const group = await db.group.findUnique({
    where: { id: groupId },
    select: { academyId: true },
  });
  if (!group || group.academyId !== academyId) throw new Error("غير مصرح");

  const title = formData.get("title") as string;
  const tutorId = parseInt(formData.get("tutorId") as string);
  const tutorHourlyRateStr = formData.get("tutorHourlyRate") as string | null;
  const tutorHourlyRate = tutorHourlyRateStr
    ? parseFloat(tutorHourlyRateStr)
    : null;

  if (!title || !tutorId) throw new Error("العنوان والمعلم مطلوبان");

  await db.group.update({
    where: { id: groupId },
    data: {
      title,
      currentTutorId: tutorId,
      tutorHourlyRate,
    },
  });

  revalidatePath("/ar/dashboard/groups");
}

// Add students to group (by student IDs)
export async function addStudentsToGroup(
  groupId: number,
  studentIds: number[],
) {
  const admin = await ensureAdmin();
  const academyId = admin?.academyId;
  if (!academyId) throw new Error("غير مصرح");

  const group = await db.group.findUnique({
    where: { id: groupId },
    select: { academyId: true },
  });
  if (!group || group.academyId !== academyId) throw new Error("غير مصرح");

  await db.$transaction(
    studentIds.map((sid) =>
      db.groupStudent.upsert({
        where: { groupId_studentId: { groupId, studentId: sid } },
        update: { active: true, leftAt: null },
        create: { groupId, studentId: sid },
      }),
    ),
  );

  revalidatePath("/ar/dashboard/groups");
}

// Remove students from group (deactivate membership)
export async function removeStudentsFromGroup(
  groupId: number,
  studentIds: number[],
) {
  const admin = await ensureAdmin();
  const academyId = admin?.academyId;
  if (!academyId) throw new Error("غير مصرح");

  const group = await db.group.findUnique({
    where: { id: groupId },
    select: { academyId: true },
  });
  if (!group || group.academyId !== academyId) throw new Error("غير مصرح");

  await db.groupStudent.updateMany({
    where: { groupId, studentId: { in: studentIds } },
    data: { active: false, leftAt: new Date() },
  });

  revalidatePath("/ar/dashboard/groups");
}

// Activate / deactivate membership
export async function toggleStudentMembership(
  groupId: number,
  studentId: number,
  active: boolean,
) {
  const admin = await ensureAdmin();
  const academyId = admin?.academyId;
  if (!academyId) throw new Error("غير مصرح");

  const group = await db.group.findUnique({
    where: { id: groupId },
    select: { academyId: true },
  });
  if (!group || group.academyId !== academyId) throw new Error("غير مصرح");

  if (active) {
    await db.groupStudent.upsert({
      where: { groupId_studentId: { groupId, studentId } },
      update: { active: true, leftAt: null },
      create: { groupId, studentId },
    });
  } else {
    await db.groupStudent.updateMany({
      where: { groupId, studentId },
      data: { active: false, leftAt: new Date() },
    });
  }

  revalidatePath("/ar/dashboard/groups");
}
