import { SessionStatus } from "@/types/session";
import dayjs from "@/lib/dayjs";

export const getSessionStatus = (session: {
  cancelledBy: number | null;
  startTime: Date;
}): SessionStatus => {
  if (session.cancelledBy) return SessionStatus.CANCELLED;
  const isCompleted = dayjs.utc().isAfter(session.startTime);

  if (isCompleted) return SessionStatus.COMPLETED;
  return SessionStatus.SCHEDULED;
};
