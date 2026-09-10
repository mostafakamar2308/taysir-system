import db from "@/lib/prisma";
import { user } from "@/lib/auth";

export async function getCurrentSupervisor() {
  const currentUser = await user();
  if (!currentUser || !currentUser.id) return null;
  return db.supervisor.findUnique({
    where: { userId: currentUser.id },
  });
}

// Prisma `OR` clause that matches any session this supervisor is responsible for:
// sessions explicitly assigned to them, or sessions of tutors under their supervision.
export function supervisorSessionScope(supervisorId: number) {
  return [
    { supervisorId },
    { tutor: { defaultSupervisorId: supervisorId } },
  ] as const;
}

// Verifies a supervisor may act on the given session's scope.
export async function assertSupervisorCanAccessSession(
  supervisorId: number,
  session: {
    supervisorId: number | null;
    tutor: { defaultSupervisorId: number | null };
  },
) {
  if (session.supervisorId !== supervisorId) {
    if (session.tutor.defaultSupervisorId !== supervisorId) {
      throw new Error("غير مصرح للوصول إلى هذه الحصة");
    }
  }
}
