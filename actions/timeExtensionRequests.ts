"use server";

import db from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import dayjs from "@/lib/dayjs";
import { Role } from "@/types/user";
import { user } from "@/lib/auth";
import { withResult, fail } from "@/lib/action-result";
import { TimeExtensionRequestStatus } from "@/types/timeExtension";

const MAX_EXTENSION_MINUTES = 240;

export const createTimeExtensionRequest = withResult(
  async (sessionId: number, addedMinutes: number) => {
    const currentUser = await user();
    if (!currentUser || !currentUser.academyId || !currentUser.tutorId)
      return fail("غير مصرح");

    if (
      !Number.isInteger(addedMinutes) ||
      addedMinutes <= 0 ||
      addedMinutes > MAX_EXTENSION_MINUTES
    ) {
      return fail(`يجب أن تكون المدة المضافة بين 1 و ${MAX_EXTENSION_MINUTES} دقيقة`);
    }

    const session = await db.session.findFirst({
      where: {
        id: sessionId,
        academyId: currentUser.academyId,
        tutorId: currentUser.tutorId,
        cancelledBy: null,
      },
      include: {
        group: { select: { title: true } },
      },
    });
    if (!session) return fail("الحصة غير موجودة");

    if (!dayjs(session.startTime).isBefore(dayjs())) {
      return fail("لا يمكن طلب تمديد الوقت إلا بعد بدء الحصة");
    }

    const pending = await db.timeExtensionRequest.findFirst({
      where: { sessionId, status: TimeExtensionRequestStatus.PENDING },
    });
    if (pending) return fail("يوجد طلب تمديد معلق بالفعل لهذه الحصة");

    const requestedEndTime = dayjs(session.startTime)
      .add(session.durationMinutes + addedMinutes, "minute")
      .toDate();

    await db.timeExtensionRequest.create({
      data: {
        sessionId: session.id,
        requestedById: currentUser.id,
        addedMinutes,
        requestedEndTime,
      },
    });

    revalidatePath("/ar/dashboard/session-management/time-extension-requests");
    return { sessionId: session.id };
  },
);

export const getTimeExtensionRequests = withResult(async () => {
  const currentUser = await user();
  if (
    !currentUser ||
    !currentUser.academyId ||
    (currentUser.role !== Role.Admin && currentUser.role !== Role.SuperAdmin)
  ) {
    return fail("غير مصرح");
  }

  const requests = await db.timeExtensionRequest.findMany({
    where: { session: { academyId: currentUser.academyId } },
    include: {
      session: {
        include: {
          group: { select: { id: true, title: true } },
          tutor: { select: { user: { select: { name: true } } } },
          participants: {
            include: { student: { select: { user: { select: { name: true } } } } },
          },
        },
      },
      requestedBy: {
        select: { id: true, name: true },
      },
      decidedBy: {
        select: { id: true, name: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return requests.map((r) => {
    const endTime = dayjs(r.session.startTime)
      .add(r.session.durationMinutes, "minute")
      .toISOString();
    return {
      id: r.id,
      addedMinutes: r.addedMinutes,
      requestedEndTime: r.requestedEndTime.toISOString(),
      status: r.status,
      createdAt: r.createdAt.toISOString(),
      requestedById: r.requestedById,
      requestedByName: r.requestedBy?.name ?? "—",
      decidedById: r.decidedById,
      decidedByName: r.decidedBy?.name ?? null,
      decidedAt: r.decidedAt?.toISOString() ?? null,
      session: {
        id: r.session.id,
        startTime: r.session.startTime.toISOString(),
        endTime,
        durationMinutes: r.session.durationMinutes,
        topic: r.session.topic,
        cancelledBy: r.session.cancelledBy,
        groupId: r.session.group.id,
        groupName: r.session.group.title,
        tutorName: r.session.tutor.user.name ?? "—",
        studentNames: r.session.participants.map(
          (p) => p.student.user.name ?? "—",
        ),
      },
    };
  });
});

export const decideTimeExtensionRequest = withResult(
  async (requestId: number, accept: boolean) => {
    const currentUser = await user();
    if (!currentUser || !currentUser.academyId)
      return fail("غير مصرح");
    if (currentUser.role !== Role.Admin && currentUser.role !== Role.SuperAdmin)
      return fail("غير مصرح");

    const request = await db.timeExtensionRequest.findFirst({
      where: {
        id: requestId,
        session: { academyId: currentUser.academyId },
      },
      include: { session: true },
    });
    if (!request) return fail("الطلب غير موجود");
    if (request.status !== TimeExtensionRequestStatus.PENDING)
      return fail("تمت مراجعة هذا الطلب من قبل");

    if (accept) {
      await db.$transaction([
        db.timeExtensionRequest.update({
          where: { id: request.id },
          data: {
            status: TimeExtensionRequestStatus.ACCEPTED,
            decidedById: currentUser.id,
            decidedAt: new Date(),
          },
        }),
        db.session.update({
          where: { id: request.sessionId },
          data: {
            durationMinutes:
              request.session.durationMinutes + request.addedMinutes,
          },
        }),
      ]);
    } else {
      await db.timeExtensionRequest.update({
        where: { id: request.id },
        data: {
          status: TimeExtensionRequestStatus.REJECTED,
          decidedById: currentUser.id,
          decidedAt: new Date(),
        },
      });
    }

    revalidatePath("/ar/dashboard/sessions");
    revalidatePath("/ar/dashboard/tutor/sessions");
    revalidatePath("/ar/dashboard/session-management/time-extension-requests");
  },
);