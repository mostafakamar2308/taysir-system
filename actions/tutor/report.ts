"use server";

import db from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getTokenFromCookie, verifyToken } from "@/lib/jwt";
import dayjs from "@/lib/dayjs";
import { sendSingleMessage } from "./sendMessage";

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
    include: {
      student: {
        select: { user: { select: { name: true, phone: true } } },
      },
    },
  });
  if (!session) throw new Error("الحصة غير موجودة");
  if (session.tutorId !== payload.tutorId) throw new Error("غير مصرح");

  await db.sessionReport.upsert({
    where: { sessionId },
    update: data,
    create: { sessionId, ...data },
  });

  if (session.student.user.phone) {
    const message = {
      phoneNumber: session.student.user.phone,
      content: `السلام عليكم، ${session.student.user.name ? `والد الطالب ${session.student.user.name}` : ""}
هذا تقرير حصة يوم ${dayjs(session.startTime).format("dddd")}:
${data.rating ? `تقييم الحصة: ${data.rating}` : ""}
${data.outcomes ? `نتائج الحصة: ${data.outcomes}` : ""}
${data.strengths ? `نقاط القوة: ${data.strengths}` : ""}
${data.weaknesses ? `نقاط الضعف: ${data.weaknesses}` : ""}
${data.nextGoals ? `أهداف الحصة القادمة: ${data.nextGoals}` : ""}
      `,
    };

    await sendSingleMessage(message.phoneNumber, message.content);
  }
  revalidatePath("/ar/dashboard/tutor/sessions");
}
