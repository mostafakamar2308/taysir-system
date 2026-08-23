"use server";

import db from "@/lib/prisma";
import { whatsappQueue } from "@/lib/queue/whatsappQueue";
import {
  assertSupervisorCanAccessSession,
  getCurrentSupervisor,
} from "@/lib/supervisor";
import dayjs from "@/lib/dayjs";
import { revalidatePath } from "next/cache";
import { AttendanceStatus } from "@/types/session";
import { withResult, fail } from "@/lib/action-result";

function formatPhoneToJid(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  return `${cleaned}@s.whatsapp.net`;
}

async function enqueueMessage(
  academyId: number,
  instanceName: string,
  recipientJid: string,
  message: string,
) {
  const log = await db.whatsAppMessage.create({
    data: {
      academyId,
      remoteJid: recipientJid,
      type: "text",
      content: message,
      status: "pending",
    },
  });
  await whatsappQueue.add("session-reminder", {
    academyId,
    instanceName,
    recipientJid,
    message,
    messageLogId: log.id,
  });
}

type ReminderSession = {
  academy: {
    whatsappConnectionStatus: string | null;
    whatsappInstanceName: string | null;
  };
  tutor: {
    user: { name: string | null; phone: string | null };
    defaultSupervisorId: number | null;
  };
  participants: {
    student: { user: { name: string | null; phone: string | null } };
    studentAttendanceStatus: number | null;
  }[];
};

async function loadSessionForReminder(sessionId: number) {
  const supervisor = await getCurrentSupervisor();
  if (!supervisor) return fail("غير مصرح");

  const session = await db.session.findUnique({
    where: { id: sessionId },
    include: {
      academy: {
        select: {
          whatsappConnectionStatus: true,
          whatsappInstanceName: true,
        },
      },
      tutor: {
        select: {
          defaultSupervisorId: true,
          user: { select: { name: true, phone: true } },
        },
      },
      participants: {
        include: {
          student: {
            select: { user: { select: { name: true, phone: true } } },
          },
        },
      },
    },
  });

  if (!session) return fail("الحصة غير موجودة");
  await assertSupervisorCanAccessSession(supervisor.id, session);
  return { supervisor, session };
}

function assertWhatsappReady(
  session: ReminderSession,
): asserts session is ReminderSession & {
  academy: { whatsappInstanceName: string };
} {
  if (
    session.academy.whatsappConnectionStatus !== "connected" ||
    !session.academy.whatsappInstanceName
  ) {
    return fail("واتساب غير متصل");
  }
}

export const sendSessionReminder = withResult(async (sessionId: number) => {
  const { session } = await loadSessionForReminder(sessionId);
  assertWhatsappReady(session);

  const instanceName = session.academy.whatsappInstanceName;
  const startTimeStr = dayjs
    .utc(session.startTime)
    .tz("Africa/Cairo")
    .format("hh:mm A");
  const dayStr = dayjs.utc(session.startTime).tz("Africa/Cairo").format("dddd");
  const linkLine = session.zoomUrl ? `\nلينك الحصة: ${session.zoomUrl}` : "";

  let sent = 0;

  for (const p of session.participants) {
    const phone = p.student.user.phone;
    if (!phone) continue;
    const message = `تذكير: لديك حصة "${session.topic || "حصتك"}" مع ${session.tutor.user.name || "المعلم"} يوم ${dayStr} (الساعة ${startTimeStr}).${linkLine}`;
    await enqueueMessage(session.academyId, instanceName, formatPhoneToJid(phone), message);
    sent++;
  }

  if (session.tutor.user.phone) {
    const studentNames = session.participants
      .map((p) => p.student.user.name)
      .filter(Boolean)
      .join("، ");
    const message = `تذكير: لديك حصة "${session.topic || "حصتك"}" مع الطلاب: ${studentNames || "..."} يوم ${dayStr} (الساعة ${startTimeStr}).${linkLine}`;
    await enqueueMessage(
      session.academyId,
      instanceName,
      formatPhoneToJid(session.tutor.user.phone),
      message,
    );
    sent++;
  }

  revalidatePath("/ar/dashboard/supervisor/sessions");
  return { sent };
});

export const sendZoomLink = withResult(async (sessionId: number) => {
  const { session } = await loadSessionForReminder(sessionId);
  assertWhatsappReady(session);

  if (!session.zoomUrl) return fail("لا يوجد رابط زووم لهذه الحصة");

  const instanceName = session.academy.whatsappInstanceName;
  const startTimeStr = dayjs
    .utc(session.startTime)
    .tz("Africa/Cairo")
    .format("hh:mm A");
  const dayStr = dayjs.utc(session.startTime).tz("Africa/Cairo").format("dddd");
  const base = `لينك حصة "${session.topic || "الحصة"}" يوم ${dayStr} (الساعة ${startTimeStr}):\n${session.zoomUrl}`;

  let sent = 0;

  for (const p of session.participants) {
    const phone = p.student.user.phone;
    if (!phone) continue;
    await enqueueMessage(session.academyId, instanceName, formatPhoneToJid(phone), base);
    sent++;
  }

  if (session.tutor.user.phone) {
    await enqueueMessage(
      session.academyId,
      instanceName,
      formatPhoneToJid(session.tutor.user.phone),
      base,
    );
    sent++;
  }

  revalidatePath("/ar/dashboard/supervisor/sessions");
  return { sent };
});

export const sendReportReminder = withResult(async (sessionId: number) => {
  const { session } = await loadSessionForReminder(sessionId);
  assertWhatsappReady(session);

  if (!session.tutor.user.phone) return fail("لا يوجد رقم هاتف للمعلم");

  const studentNames = session.participants
    .filter(
      (p) =>
        p.studentAttendanceStatus !== null &&
        [AttendanceStatus.ATTENDED, AttendanceStatus.LATE].includes(
          p.studentAttendanceStatus,
        ),
    )
    .map((p) => p.student.user.name ?? "طالب");

  if (studentNames.length === 0) return fail("لا يوجد تقارير ناقصة لهذه الحصة");

  const message = `تذكير: يرجى إضافة تقارير الحصة "${session.topic || "الحصة"}" للطلاب التاليين:\n${studentNames.join("، ")}`;

  await enqueueMessage(
    session.academyId,
    session.academy.whatsappInstanceName,
    formatPhoneToJid(session.tutor.user.phone),
    message,
  );

  revalidatePath("/ar/dashboard/supervisor/sessions");
  return { sent: 1 };
});
