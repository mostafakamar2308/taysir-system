"use server";

import db from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getTokenFromCookie, verifyToken } from "@/lib/jwt";
import dayjs from "@/lib/dayjs";
import { sendSingleMessage } from "./sendMessage";
import { withResult, fail } from "@/lib/action-result";
import { markTutorAttended } from "@/lib/tutorAttendance";

export const upsertSessionReport = withResult(
  async (
    participantId: number,
    data: {
      rating?: number;
      outcomes?: string | null;
      strengths?: string | null;
      weaknesses?: string | null;
      nextGoals?: string | null;
      comments?: string | null;
    },
  ) => {
    const token = await getTokenFromCookie();
    if (!token) return fail("غير مصرح");
    const payload = verifyToken(token);
    if (!payload || !payload.tutorId) return fail("غير مصرح");

    const participant = await db.sessionParticipant.findUnique({
      where: { id: participantId },
      include: {
        session: { include: { tutor: true } },
        student: { include: { user: true } },
      },
    });
    if (!participant) return fail("المشارك غير موجود");
    if (participant.session.tutorId !== payload.tutorId)
      return fail("غير مصرح");

    // Upsert report linked to this participant
    await db.sessionReport.upsert({
      where: { participantId },
      update: data,
      create: { participantId, ...data },
    });

    await markTutorAttended({
      sessionId: participant.session.id,
      supervisorId: participant.session.supervisorId,
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
    revalidatePath("/ar/dashboard/tutor");
  },
);
