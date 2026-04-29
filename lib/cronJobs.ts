import cron from "node-cron";
import db from "@/lib/prisma";
import { whatsappQueue } from "@/lib/queue/whatsappQueue";
import dayjs from "@/lib/dayjs"; // already extended with utc and timezone plugins

function formatPhoneToJid(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  return `${cleaned}@s.whatsapp.net`;
}

cron.schedule("0,30 * * * *", async () => {
  console.log("[Cron] Checking for session reminders...");
  await sendSessionReminders();
});

cron.schedule("0 20 * * *", async () => {
  console.log("[Cron] Sending report reminders...");
  await sendReportReminders();
});

async function sendSessionReminders() {
  const now = dayjs.utc();
  const nextHour = now.add(1, "hour");

  const academies = await db.academy.findMany({
    where: {
      whatsappConnectionStatus: "connected",
      whatsappInstanceName: { not: null },
    },
    select: { id: true, whatsappInstanceName: true },
  });

  for (const academy of academies) {
    const sessions = await db.session.findMany({
      where: {
        academyId: academy.id,
        startTime: { gte: now.toDate(), lte: nextHour.toDate() },
      },
      include: {
        student: { select: { name: true, phone: true } },
        tutor: {
          select: {
            user: { select: { name: true, phone: true } },
            zoomUrl: true,
          },
        },
      },
    });

    for (const session of sessions) {
      const instanceName = academy.whatsappInstanceName!;

      // session.startTime is stored in UTC
      const sessionStart = dayjs.utc(session.startTime);
      const diffMs = sessionStart.diff(now);
      const minutesUntil = Math.max(1, Math.round(diffMs / 60000));

      const timeText =
        minutesUntil === 1 ? "دقيقة واحدة" : `${minutesUntil} دقائق`;
      const startTimeStr = sessionStart.tz("Africa/Cairo").format("hh:mm A");

      // Student message
      if (session.student?.phone) {
        const studentMsg = `تذكير: لديك حصة "${session.topic || "حصتك"}" مع ${session.tutor?.user.name || "المعلم"} بعد ${timeText} (الساعة ${startTimeStr}). 
        ${session.tutor.zoomUrl ? `لينك الحصة: ${session.tutor.zoomUrl}` : ""}
        `;
        await whatsappQueue.add("session-reminder", {
          academyId: academy.id,
          instanceName,
          recipientJid: formatPhoneToJid(session.student.phone),
          message: studentMsg,
        });
      }

      // Tutor message
      if (session.tutor?.user.phone) {
        const tutorMsg = `تذكير: لديك حصة "${session.topic || "حصتك"}" مع الطالب ${session.student?.name || "طالب"} بعد ${timeText} (الساعة ${startTimeStr}).
        ${session.tutor.zoomUrl ? `لينك الحصة: ${session.tutor.zoomUrl}` : ""}
        `;
        await whatsappQueue.add("session-reminder", {
          academyId: academy.id,
          instanceName,
          recipientJid: formatPhoneToJid(session.tutor.user.phone),
          message: tutorMsg,
        });
      }
    }
  }
}

async function sendReportReminders() {
  // Get Cairo today boundaries
  const cairoTodayStart = dayjs().tz("Africa/Cairo").startOf("day");
  const cairoTodayEnd = dayjs().tz("Africa/Cairo").endOf("day");

  // Convert to UTC for database query (DB stores UTC)
  const startOfDayUTC = cairoTodayStart.utc().toDate();
  const endOfDayUTC = cairoTodayEnd.utc().toDate();

  const academies = await db.academy.findMany({
    where: {
      whatsappConnectionStatus: "connected",
      whatsappInstanceName: { not: null },
    },
    select: { id: true, whatsappInstanceName: true },
  });

  for (const academy of academies) {
    const sessionsWithoutReport = await db.session.findMany({
      where: {
        academyId: academy.id,
        startTime: { gte: startOfDayUTC, lte: endOfDayUTC },
        sessionReport: null,
      },
      include: {
        student: { select: { name: true } },
        tutor: {
          select: { id: true, user: { select: { name: true, phone: true } } },
        },
      },
    });

    const tutorMap = new Map<
      number,
      { name: string | null; phone: string | null; students: Set<string> }
    >();

    for (const session of sessionsWithoutReport) {
      if (!session.tutor?.user.phone) continue;
      const tutorId = session.tutor.id;
      if (!tutorMap.has(tutorId)) {
        tutorMap.set(tutorId, {
          name: session.tutor.user.name,
          phone: session.tutor.user.phone,
          students: new Set(),
        });
      }
      tutorMap.get(tutorId)!.students.add(session.student.name);
    }

    for (const [_, info] of tutorMap) {
      const studentList = Array.from(info.students).join("، ");
      const message = `تذكير: يرجى إضافة تقارير الحصص للطلاب التاليين:\n${studentList}`;
      await whatsappQueue.add("report-reminder", {
        academyId: academy.id,
        instanceName: academy.whatsappInstanceName!,
        recipientJid: formatPhoneToJid(info.phone!),
        message,
      });
    }
  }
}
