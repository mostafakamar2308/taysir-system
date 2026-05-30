"use server";

import db from "@/lib/prisma";
import bcrypt from "bcrypt";
import { signToken, setTokenCookie, removeTokenCookie } from "@/lib/jwt";
import { redirect } from "next/navigation";
import { Role } from "@/types/user";

export async function login(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "يرجى إدخال البريد الإلكتروني وكلمة المرور" };
  }

  const user = await db.user.findUnique({
    where: { email },
    include: {
      admin: { include: { academy: true } },
      supervisor: true,
      tutor: true,
      student: true,
    },
  });

  if (!user) {
    return { error: "البريد الإلكتروني غير صحيح" };
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return { error: "كلمة المرور غير صحيحة" };
  }

  // Determine academyId if applicable
  let academyId: number | undefined;
  let tutorId: number | undefined;
  let studentId: number | undefined;
  if (user.admin) academyId = user.admin.academyId;
  else if (user.supervisor) academyId = user.supervisor.academyId;
  else if (user.tutor) {
    academyId = user.tutor.academyId;
    tutorId = user.tutor.id;
  } else if (user.role === Role.Student) {
    academyId = user.student?.academyId;
    studentId = user.student?.id;
  }

  const payload = {
    id: user.id,
    email: user.email,
    name: user.name || "",
    role: user.role,
    academyId,
    tutorId,
    studentId,
  };

  const token = signToken(payload);
  await setTokenCookie(token);

  if (user.role === Role.SuperAdmin) {
    redirect("/ar/dashboard/admin/academies");
  } else if (user.role === Role.Admin) {
    redirect("/ar/dashboard");
  } else if (user.role === Role.Supervisor) {
    redirect("/ar/dashboard/supervisor");
  } else if (user.role === Role.Tutor) {
    redirect("/ar/dashboard/tutor");
  } else {
    redirect("/ar/dashboard/student");
  }
}

export async function logout() {
  await removeTokenCookie();
  redirect("/login");
}
