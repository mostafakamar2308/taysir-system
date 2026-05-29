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

/**
 * Count distinct students that had a specific creation action within a period
 * and were NOT converted via any of the given conversion actions before the start of the period.
 *
 * @param academyId - Academy ID
 * @param startDate - Start of the period (exclusive for conversions)
 * @param endDate - End of the period (exclusive for creation)
 * @param creationAction - The action that marks the start of the funnel (e.g., LeadCreated)
 * @param conversionActions - Array of actions that indicate conversion out of the funnel
 * @returns Number of unique students matching the criteria
 */
export async function countActiveInPeriod(
  academyId: number,
  startDate: Date,
  endDate: Date,
  creationAction: HistoryActionType,
  conversionActions: HistoryActionType[],
): Promise<number> {
  // Use PostgreSQL ANY operator to pass an array of integers safely
  const result = await db.$queryRaw<{ count: number }[]>`
    SELECT COUNT(DISTINCT h."targetId") as count
    FROM "History" h
    WHERE h."academyId" = ${academyId}
      AND h."targetType" = ${TargetType.Student}
      AND h."action" = ${creationAction}
      AND h."createdAt" < ${endDate}
      AND NOT EXISTS (
        SELECT 1 FROM "History" conv
        WHERE conv."targetId" = h."targetId"
          AND conv."targetType" = ${TargetType.Student}
          AND conv."academyId" = ${academyId}
          AND conv."action" = ANY(${conversionActions}::int[])
          AND conv."createdAt" < ${startDate}
      )
  `;
  return Number(result[0]?.count ?? 0);
}
