import cron from "node-cron";
import db from "@/lib/prisma";
import { whatsappQueue } from "@/lib/queue/whatsappQueue";
import dayjs from "@/lib/dayjs";
import { AttendanceStatus } from "@/types/session";

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

// ---------- Session reminders (multi‑student) ----------
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
        cancelledBy: null,
      },
      include: {
        participants: {
          include: {
            student: {
              select: { user: { select: { name: true, phone: true } } },
            },
          },
        },
        tutor: {
          select: {
            user: { select: { name: true, phone: true } },
            zoomUrl: true,
          },
        },
      },
    });

    const instanceName = academy.whatsappInstanceName!;

    for (const session of sessions) {
      const sessionStart = dayjs.utc(session.startTime);
      const diffMs = sessionStart.diff(now);
      const minutesUntil = Math.max(1, Math.round(diffMs / 60000));
      const timeText =
        minutesUntil === 1 ? "دقيقة واحدة" : `${minutesUntil} دقائق`;
      const startTimeStr = sessionStart.tz("Africa/Cairo").format("hh:mm A");

      // Send to every participant (student)
      for (const p of session.participants) {
        const phone = p.student.user.phone;
        if (!phone) continue;
        const studentMsg = `تذكير: لديك حصة "${session.topic || "حصتك"}" مع ${session.tutor?.user.name || "المعلم"} بعد ${timeText} (الساعة ${startTimeStr}). 
        ${session.zoomJoinUrl ? `لينك الحصة: ${session.zoomJoinUrl}` : ""}
        `;
        await whatsappQueue.add("session-reminder", {
          academyId: academy.id,
          instanceName,
          recipientJid: formatPhoneToJid(phone),
          message: studentMsg,
        });
      }

      // Send to tutor
      if (session.tutor?.user.phone) {
        const studentNames = session.participants
          .map((p) => p.student.user.name)
          .join("، ");
        const tutorMsg = `تذكير: لديك حصة "${session.topic || "حصتك"}" مع الطلاب: ${studentNames} بعد ${timeText} (الساعة ${startTimeStr}).
        ${session.zoomStartUrl ? `لينك الحصة: ${session.zoomStartUrl}` : ""}
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

// ---------- Report reminders (per participant) ----------
async function sendReportReminders() {
  const cairoTodayStart = dayjs().tz("Africa/Cairo").startOf("day");
  const cairoTodayEnd = dayjs().tz("Africa/Cairo").endOf("day");
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
    // Find participants who attended but have no report
    const participantsMissingReport = await db.sessionParticipant.findMany({
      where: {
        session: {
          academyId: academy.id,
          startTime: { gte: startOfDayUTC, lte: endOfDayUTC },
          cancelledBy: null,
        },
        studentAttendanceStatus: {
          in: [AttendanceStatus.ATTENDED, AttendanceStatus.LATE],
        },
        report: null,
      },
      select: {
        student: { select: { user: { select: { name: true } } } },
        session: {
          select: {
            tutor: {
              select: {
                id: true,
                user: { select: { name: true, phone: true } },
              },
            },
          },
        },
      },
    });

    // Group by tutor → list of student names
    const tutorMap = new Map<
      number,
      { name: string | null; phone: string | null; students: Set<string> }
    >();

    for (const p of participantsMissingReport) {
      const tutorId = p.session.tutor.id;
      if (!tutorMap.has(tutorId)) {
        tutorMap.set(tutorId, {
          name: p.session.tutor.user.name,
          phone: p.session.tutor.user.phone,
          students: new Set(),
        });
      }
      tutorMap.get(tutorId)!.students.add(p.student.user.name || "طالب");
    }

    for (const [_, info] of tutorMap) {
      if (!info.phone) continue;
      const studentList = Array.from(info.students).join("، ");
      const message = `تذكير: يرجى إضافة تقارير الحصص للطلاب التاليين:\n${studentList}`;
      await whatsappQueue.add("report-reminder", {
        academyId: academy.id,
        instanceName: academy.whatsappInstanceName!,
        recipientJid: formatPhoneToJid(info.phone),
        message,
      });
    }
  }
}
