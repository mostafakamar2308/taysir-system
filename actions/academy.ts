"use server";

import db from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Role } from "@/types/user";

const academySchema = z.object({
  name: z.string().min(1, "الاسم مطلوب"),
  adminId: z.number().optional().nullable(),
  maxStudents: z.number().int().positive().optional().nullable(),
  maxTutors: z.number().int().positive().optional().nullable(),
  primaryColor: z.string().optional().nullable(),
});

export async function createAcademy(formData: FormData) {
  const name = formData.get("name") as string;
  const adminId = parseInt(formData.get("adminId") as string) || null;
  const maxStudents = formData.get("maxStudents")
    ? parseInt(formData.get("maxStudents") as string)
    : null;
  const maxTutors = formData.get("maxTutors")
    ? parseInt(formData.get("maxTutors") as string)
    : null;
  const primaryColor = (formData.get("primaryColor") as string) || null;

  const validated = academySchema.parse({
    name,
    adminId,
    maxStudents,
    maxTutors,
    primaryColor,
  });

  // If adminId is provided, ensure the user exists and is not already an admin
  if (validated.adminId) {
    const user = await db.user.findUnique({
      where: { id: validated.adminId },
      include: { admin: true },
    });
    if (!user) throw new Error("المستخدم غير موجود");
    if (user.admin)
      throw new Error("هذا المستخدم مشرف بالفعل على أكاديمية أخرى");
    if (user.role !== Role.Admin) {
      // Optionally update role to Admin
      await db.user.update({
        where: { id: validated.adminId },
        data: { role: Role.Admin },
      });
    }
  }

  // Create academy
  const academy = await db.academy.create({
    data: {
      name: validated.name,
      maxStudents: validated.maxStudents || 500,
      maxTutors: validated.maxTutors || 20,
      primaryColor: validated.primaryColor || "#353531",
    },
  });

  // If adminId was provided, create the Admin link
  if (validated.adminId) {
    await db.admin.create({
      data: {
        userId: validated.adminId,
        academyId: academy.id,
      },
    });
  }

  revalidatePath("/admin/academies");
  return academy;
}

export async function updateAcademy(id: number, formData: FormData) {
  const name = formData.get("name") as string;
  const adminId = (formData.get("adminId") as string) || null;
  const maxStudents = formData.get("maxStudents")
    ? parseInt(formData.get("maxStudents") as string)
    : null;
  const maxTutors = formData.get("maxTutors")
    ? parseInt(formData.get("maxTutors") as string)
    : null;
  const primaryColor = (formData.get("primaryColor") as string) || null;

  const validated = academySchema.parse({
    name,
    adminId,
    maxStudents,
    maxTutors,
    primaryColor,
  });

  // Get current academy to check admin changes
  const currentAcademy = await db.academy.findUnique({
    where: { id },
    include: { admin: true },
  });
  if (!currentAcademy) throw new Error("الأكاديمية غير موجودة");

  // Handle admin change
  if (currentAcademy.admin?.userId !== validated.adminId) {
    // Remove old admin if exists
    if (currentAcademy.admin) {
      await db.admin.delete({ where: { id: currentAcademy.admin.id } });
    }
    // Add new admin if provided
    if (validated.adminId) {
      // Check if user is already admin elsewhere
      const existingAdmin = await db.admin.findUnique({
        where: { userId: validated.adminId },
      });
      if (existingAdmin)
        throw new Error("هذا المستخدم مشرف بالفعل على أكاديمية أخرى");

      await db.admin.create({
        data: {
          userId: validated.adminId,
          academyId: id,
        },
      });

      // Ensure user role is Admin
      await db.user.update({
        where: { id: validated.adminId },
        data: { role: Role.Admin },
      });
    }
  }

  // Update academy
  await db.academy.update({
    where: { id },
    data: {
      name: validated.name,
      maxStudents: validated.maxStudents || 500,
      maxTutors: validated.maxTutors || 20,
      primaryColor: validated.primaryColor || "#353531",
    },
  });

  revalidatePath("/admin/academies");
}

export async function deleteAcademy(id: number) {
  // First delete related admin link
  await db.admin.deleteMany({ where: { academyId: id } });
  // Then delete academy
  await db.academy.delete({ where: { id } });
  revalidatePath("/admin/academies");
}

export async function getAcademies() {
  const academies = await db.academy.findMany({
    include: {
      admin: { include: { user: true } },
      students: true,
      tutors: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return academies.map((a) => ({
    id: a.id,
    name: a.name,
    adminId: a.admin?.userId || null,
    adminName: a.admin?.user.name || null,
    maxStudents: a.maxStudents,
    maxTutors: a.maxTutors,
    primaryColor: a.primaryColor,
    createdAt: a.createdAt,
    studentCount: a.students.length,
    tutorCount: a.tutors.length,
  }));
}
