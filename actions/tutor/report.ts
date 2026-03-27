"use server";

import db from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getTokenFromCookie, verifyToken } from "@/lib/jwt";

export async function upsertSessionReport(
  sessionId: number,
  data: {
    rating?: number;
    outcomes?: string | null;
    strengths?: string | null;
    weaknesses?: string | null;
    nextGoals?: string | null;
    comments?: string | null;
  },
) {
  const token = await getTokenFromCookie();
  if (!token) throw new Error("غير مصرح");
  const payload = verifyToken(token);
  if (!payload || !payload.tutorId) throw new Error("غير مصرح");

  const session = await db.session.findUnique({
    where: { id: sessionId },
    select: { tutorId: true },
  });
  if (!session) throw new Error("الحصة غير موجودة");
  if (session.tutorId !== payload.tutorId) throw new Error("غير مصرح");

  await db.sessionReport.upsert({
    where: { sessionId },
    update: data,
    create: { sessionId, ...data },
  });

  revalidatePath("/tutor/sessions");
}
