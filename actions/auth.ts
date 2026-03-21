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
    },
  });

  if (!user) {
    return { error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" };
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return { error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" };
  }

  // Determine academyId if applicable
  let academyId: number | undefined;
  if (user.admin) academyId = user.admin.academyId;
  else if (user.supervisor) academyId = user.supervisor.academyId;
  else if (user.tutor) academyId = user.tutor.academyId;

  const payload = {
    id: user.id,
    email: user.email,
    name: user.name || "",
    role: user.role,
    academyId,
  };

  const token = signToken(payload);
  await setTokenCookie(token);

  if (user.role === Role.SuperAdmin) {
    // SuperAdmin
    redirect("/ar/dashboard/admin/academies");
  } else if (user.role === Role.Admin) {
    // Admin (academy owner)
    redirect("/ar/dashboard");
  } else {
    // Supervisor (2) or Tutor (3)
    redirect("/ar/dashboard"); // but we'll show a different dashboard based on role
  }
}

export async function logout() {
  await removeTokenCookie();
  redirect("/login");
}
