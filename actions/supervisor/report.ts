"use server";

import db from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import {
  assertSupervisorCanAccessSession,
  getCurrentSupervisor,
} from "@/lib/supervisor";

export async function upsertSessionReportBySupervisor(
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
  const supervisor = await getCurrentSupervisor();
  if (!supervisor) throw new Error("غير مصرح");

  const participant = await db.sessionParticipant.findUnique({
    where: { id: participantId },
    include: {
      session: {
        select: {
          supervisorId: true,
          tutor: { select: { defaultSupervisorId: true } },
        },
      },
    },
  });
  if (!participant) throw new Error("المشارك غير موجود");
  await assertSupervisorCanAccessSession(supervisor.id, participant.session);

  await db.sessionReport.upsert({
    where: { participantId },
    update: data,
    create: { participantId, ...data },
  });

  revalidatePath("/ar/dashboard/supervisor/sessions");
  revalidatePath("/ar/dashboard/supervisor");
  revalidatePath("/ar/dashboard/supervisor/reports");
}
