"use server";

import db from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getTokenFromCookie, verifyToken } from "@/lib/jwt";
import { z } from "zod";
import bcrypt from "bcrypt";
import { Role } from "@/types/user";
import dayjs from "@/lib/dayjs";

const createAcademySchema = z.object({
  name: z.string().min(1),
  adminName: z.string().min(1),
  adminEmail: z.string().email(),
  adminPassword: z.string().min(6),
  saasPlanId: z.number(),
  isFreeTrial: z.boolean().optional(),
});

const updateAcademySchema = z.object({
  name: z.string().min(1).optional(),
  adminId: z.number().nullable().optional(),
  saasPlanId: z.number().nullable().optional(),
});

export async function createAcademy(data: z.infer<typeof createAcademySchema>) {
  const token = await getTokenFromCookie();
  if (!token) throw new Error("غير مصرح");
  const payload = verifyToken(token);
  if (!payload || payload.role !== Role.SuperAdmin) throw new Error("غير مصرح");

  const validated = createAcademySchema.parse(data);
  const hashedPassword = await bcrypt.hash(validated.adminPassword, 10);

  // Create the admin user
  const adminUser = await db.user.create({
    data: {
      name: validated.adminName,
      email: validated.adminEmail,
      password: hashedPassword,
      role: Role.Admin,
      timezone: "Africa/Cairo",
    },
  });

  // Create the academy
  let saasPlanStartDate: Date | null = null;
  let saasPlanEndDate: Date | null = null;
  const plan = await db.saasPlan.findUnique({
    where: { id: validated.saasPlanId },
  });
  if (!plan) throw new Error("No Plan with this ID");
  if (validated.isFreeTrial && validated.saasPlanId) {
    saasPlanStartDate = new Date();
    saasPlanEndDate = dayjs().add(plan.billingPeriod, "day").toDate();
  }

  const currency = await db.currency.findFirst({});
  if (!currency) throw new Error("No currency");

  const academy = await db.academy.create({
    data: {
      name: validated.name,
      saasPlanId: validated.saasPlanId,
      saasPlanStartDate,
      saasPlanEndDate,
      maxStudents: plan?.maxStudents,
      maxTutors: plan?.maxTutors,
      defaultCurrencyId: currency.id,
      primaryColor: "#ff0",
    },
  });

  // Link the admin to the academy
  await db.admin.create({
    data: {
      userId: adminUser.id,
      academyId: academy.id,
    },
  });

  revalidatePath("/ar/dashboard/admin/academies");
  return academy;
}

export async function updateAcademy(
  id: number,
  data: z.infer<typeof updateAcademySchema>,
) {
  const token = await getTokenFromCookie();
  if (!token) throw new Error("غير مصرح");
  const payload = verifyToken(token);
  if (!payload || payload.role !== Role.SuperAdmin) throw new Error("غير مصرح");

  const validated = updateAcademySchema.parse(data);

  await db.academy.update({
    where: { id },
    data: {
      name: validated.name,
      saasPlanId: validated.saasPlanId,
    },
  });

  // If adminId is provided, we need to update the admin relationship
  if (validated.adminId !== undefined) {
    const existingAdmin = await db.admin.findUnique({
      where: { academyId: id },
    });
    if (!existingAdmin) throw new Error("No Admin was found");
    await db.academy.update({
      where: { id: existingAdmin.id },
      data: { adminId: validated.adminId },
    });
  }

  revalidatePath("/ar/dashboard/admin/academies");
  revalidatePath(`/ar/dashboard/admin/academies/${id}`);
}

export async function deleteAcademy(id: number) {
  const token = await getTokenFromCookie();
  if (!token) throw new Error("غير مصرح");
  const payload = verifyToken(token);
  if (!payload || payload.role !== Role.SuperAdmin) throw new Error("غير مصرح");

  await db.academy.delete({ where: { id } });
  revalidatePath("/ar/dashboard/admin/academies");
}
