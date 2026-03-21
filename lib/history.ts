import db from "@/lib/prisma";
import { TargetType, HistoryActionType } from "@/types/history";
import { StudentStatus } from "@/types/student";

export async function recordStudentStatusChangeHistory(
  studentId: number,
  oldStatus: number,
  newStatus: number,
  recordedBy: number,
  academyId: number,
) {
  let action: HistoryActionType | null = null;
  const changes = { oldStatus, newStatus };

  if (oldStatus === StudentStatus.lead && newStatus === StudentStatus.trial) {
    action = HistoryActionType.LeadToTrial;
  }

  if (
    oldStatus === StudentStatus.lead &&
    newStatus === StudentStatus.subscribed
  ) {
    action = HistoryActionType.LeadToSubscription;
  }

  if (
    oldStatus === StudentStatus.trial &&
    newStatus === StudentStatus.subscribed
  ) {
    action = HistoryActionType.TrialToSubscription;
  }

  if (action !== null) {
    await db.history.create({
      data: {
        targetType: TargetType.Student,
        targetId: studentId,
        action,
        changes: JSON.stringify(changes),
        recordedBy,
        recorderType: TargetType.Admin, // or derive from user role
        academyId,
      },
    });
  }
}

export async function recordLeadCreatedHistory(
  studentId: number,
  recordedBy: number,
  academyId: number,
) {
  await db.history.create({
    data: {
      targetType: TargetType.Student,
      targetId: studentId,
      action: HistoryActionType.LeadCreated,
      recordedBy,
      recorderType: TargetType.Admin,
      academyId,
    },
  });
}

export async function recordStudentTutorChangeHistory(
  studentId: number,
  oldTutorId: number | null,
  newTutorId: number | null,
  recordedBy: number,
  academyId: number,
) {
  // Only record if there's an actual change
  if (oldTutorId === newTutorId) return;

  const changes = { oldTutorId, newTutorId };
  await db.history.create({
    data: {
      targetType: TargetType.Student,
      targetId: studentId,
      action: HistoryActionType.StudentTutorChange,
      changes: JSON.stringify(changes),
      recordedBy,
      recorderType: TargetType.Admin,
      academyId,
    },
  });
}

export async function recordStudentPlanChangeHistory(
  studentId: number,
  oldPlanId: number | null,
  newPlanId: number | null,
  recordedBy: number,
  academyId: number,
) {
  // Only record if there's an actual change
  if (oldPlanId === newPlanId) return;

  const changes = { oldPlanId, newPlanId };
  await db.history.create({
    data: {
      targetType: TargetType.Student,
      targetId: studentId,
      action: HistoryActionType.StudentPlanChange,
      changes: JSON.stringify(changes),
      recordedBy,
      recorderType: TargetType.Admin,
      academyId,
    },
  });
}
