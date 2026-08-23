"use server";

import db from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getTokenFromCookie, verifyToken } from "@/lib/jwt";
import { z } from "zod";
import bcrypt from "bcrypt";
import { Role } from "@/types/user";
import dayjs from "@/lib/dayjs";
import { withResult, fail } from "@/lib/action-result";

const createAcademySchema = z.object({
  name: z.string().min(1),
  adminName: z.string().min(1),
  adminEmail: z.string().email(),
  adminPassword: z.string().min(6),
  saasPlanId: z.number().optional(),
  isFreeTrial: z.boolean().optional(),
});

const updateAcademySchema = z.object({
  name: z.string().min(1).optional(),
  adminId: z.number().nullable().optional(),
  saasPlanId: z.number().nullable().optional(),
});

export const createAcademy = withResult(async (data: z.infer<typeof createAcademySchema>) => {
  const token = await getTokenFromCookie();
  if (!token) return fail("غير مصرح");
  const payload = verifyToken(token);
  if (!payload || payload.role !== Role.SuperAdmin) return fail("غير مصرح");

  const validated = createAcademySchema.safeParse(data);
  if (!validated.success) {
    return fail(validated.error.issues[0]?.message ?? "بيانات غير صحيحة");
  }
  const hashedPassword = await bcrypt.hash(validated.data.adminPassword, 10);

  // Create the admin user
  const adminUser = await db.user.create({
    data: {
      name: validated.data.adminName,
      email: validated.data.adminEmail,
      password: hashedPassword,
      role: Role.Admin,
      timezone: "Africa/Cairo",
    },
  });

  // Create the academy
  let saasPlanStartDate: Date | null = null;
  let saasPlanEndDate: Date | null = null;
  const plan = await db.saasPlan.findUnique({
    where: { id: validated.data.saasPlanId },
  });
  if (!plan) return fail("لا توجد خطة بهذا المعرف");
  if (validated.data.isFreeTrial && validated.data.saasPlanId) {
    saasPlanStartDate = new Date();
    saasPlanEndDate = dayjs().add(plan.billingPeriod, "day").toDate();
  }

  const currency = await db.currency.findFirst({});
  if (!currency) return fail("لا توجد عملة");

  const academy = await db.academy.create({
    data: {
      name: validated.data.name,
      saasPlanId: validated.data.saasPlanId,
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
});

export const updateAcademy = withResult(async (
  id: number,
  data: z.infer<typeof updateAcademySchema>,
) => {
    const token = await getTokenFromCookie();
    if (!token) return fail("غير مصرح");
    const payload = verifyToken(token);
    if (!payload || payload.role !== Role.SuperAdmin) return fail("غير مصرح");

    const validated = updateAcademySchema.safeParse(data);
    if (!validated.success) {
      return fail(validated.error.issues[0]?.message ?? "بيانات غير صحيحة");
    }
    await db.academy.update({
      where: { id },
      data: {
        name: validated.data.name,
        saasPlanId: validated.data.saasPlanId,
      },
    });

    // If adminId is provided, we need to update the admin relationship
    if (validated.data.adminId !== undefined) {
      const existingAdmin = await db.admin.findUnique({
        where: { academyId: id },
      });
      if (!existingAdmin) return fail("لم يتم العثور على مشرف");
      await db.academy.update({
        where: { id: existingAdmin.id },
        data: { adminId: validated.data.adminId },
      });
    }

    revalidatePath("/ar/dashboard/admin/academies");
    revalidatePath(`/ar/dashboard/admin/academies/${id}`);
});

export const deleteAcademy = withResult(async (id: number) => {
  const token = await getTokenFromCookie();
  if (!token) return fail("غير مصرح");
  const payload = verifyToken(token);
  if (!payload || payload.role !== Role.SuperAdmin) return fail("غير مصرح");

  await db.academy.delete({ where: { id } });
  revalidatePath("/ar/dashboard/admin/academies");
});
