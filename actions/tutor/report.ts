"use server";

import db from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getTokenFromCookie, verifyToken } from "@/lib/jwt";
import dayjs from "@/lib/dayjs";
import { sendSingleMessage } from "./sendMessage";

export async function upsertSessionReport(
  participantId: number,
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

  const participant = await db.sessionParticipant.findUnique({
    where: { id: participantId },
    include: {
      session: { include: { tutor: true } },
      student: { include: { user: true } },
    },
  });
  if (!participant) throw new Error("المشارك غير موجود");
  if (participant.session.tutorId !== payload.tutorId)
    throw new Error("غير مصرح");

  // Upsert report linked to this participant
  await db.sessionReport.upsert({
    where: { participantId },
    update: data,
    create: { participantId, ...data },
  });

  if (participant.student.user.phone) {
    try {
      const studentName = participant.student.user.name ?? "";
      const sessionStart = dayjs(participant.session.startTime);
      const message = {
        phoneNumber: participant.student.user.phone,
        content: `السلام عليكم، ${studentName ? `والد الطالب ${studentName}` : ""}
هذا تقرير حصة يوم ${sessionStart.format("dddd")}:
${data.rating ? `تقييم الحصة: ${data.rating}` : ""}
${data.outcomes ? `نتائج الحصة: ${data.outcomes}` : ""}
${data.strengths ? `نقاط القوة: ${data.strengths}` : ""}
${data.weaknesses ? `نقاط الضعف: ${data.weaknesses}` : ""}
${data.nextGoals ? `أهداف الحصة القادمة: ${data.nextGoals}` : ""}`,
      };

      await sendSingleMessage(message.phoneNumber, message.content);
    } catch (error) {
      // Silently fail – report already saved, WhatsApp is not critical
      console.error("Failed to send WhatsApp report:", error);
    }
  }

  revalidatePath("/ar/dashboard/tutor/sessions");
}
