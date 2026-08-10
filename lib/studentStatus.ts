import db from "@/lib/prisma";
import { recordStudentStatusChangeHistory } from "@/lib/history";
import { StudentStatus } from "@/types/student";
import { Prisma } from "@/generated/prisma/client";

type DbClient = Prisma.TransactionClient | typeof db;

// Ensure a student is marked as subscribed once they have an active
// subscription. No-op when the student is already subscribed. Returns true
// when the status actually changed.
export async function markStudentSubscribed(
  client: DbClient,
  studentId: number,
  recordedBy: number,
  academyId: number,
) {
  const student = await client.student.findUnique({
    where: { id: studentId },
    select: { status: true },
  });
  if (!student || student.status === StudentStatus.subscribed) return false;

  await client.student.update({
    where: { id: studentId },
    data: { status: StudentStatus.subscribed },
  });

  await recordStudentStatusChangeHistory(
    studentId,
    student.status,
    StudentStatus.subscribed,
    recordedBy,
    academyId,
  );

  return true;
}
