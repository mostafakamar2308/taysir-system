import { StudentProfile } from "@/types/studentProfile";
import dayjs from "@/lib/dayjs";

export interface Warning {
  type: "danger" | "warning" | "info";
  message: string;
  action?: { label: string; onClick: () => void };
}

export function getStudentWarnings(
  student: StudentProfile,
  onMarkPayment?: () => void,
  onContact?: () => void,
  onViewAttendance?: () => void,
): Warning[] {
  const warnings: Warning[] = [];
  const now = dayjs();

  // 1. Late payment
  if (student.renewalDate) {
    const renewal = dayjs(student.renewalDate);
    const daysLeft = renewal.diff(now, "day");
    if (daysLeft < 0) {
      warnings.push({
        type: "danger",
        message: "انتهى الاشتراك – يرجى التجديد",
        action: onMarkPayment
          ? { label: "تسجيل دفعة", onClick: onMarkPayment }
          : undefined,
      });
    } else if (daysLeft < 3) {
      warnings.push({
        type: "danger",
        message: `يتبقى ${daysLeft} أيام على انتهاء الاشتراك`,
        action: onMarkPayment
          ? { label: "تجديد", onClick: onMarkPayment }
          : undefined,
      });
    } else if (daysLeft < 7) {
      warnings.push({
        type: "warning",
        message: `يتبقى ${daysLeft} أيام على التجديد`,
      });
    }
  }

  // 2. Last session absent without excuse
  const lastSession = student.sessions
    .filter((s) => dayjs(s.startTime).isBefore(now))
    .sort((a, b) => dayjs(b.startTime).diff(dayjs(a.startTime)))[0];
  if (lastSession?.attendance?.status === 2) {
    // ABSENT_UNEXCUSED
    warnings.push({
      type: "danger",
      message: "آخر حصة كانت غياب بدون عذر",
      action: onContact ? { label: "تواصل", onClick: onContact } : undefined,
    });
  }

  // 3. Attendance rate < 80%
  const completed = student.sessions.filter((s) => s.status === 1); // COMPLETED
  const attended = completed.filter(
    (s) => s.attendance?.status === 0 || s.attendance?.status === 3,
  ); // ATTENDED or LATE
  const rate =
    completed.length > 0 ? (attended.length / completed.length) * 100 : 100;
  if (rate < 80) {
    warnings.push({
      type: "warning",
      message: `نسبة الحضور ${Math.round(rate)}% (أقل من 80%)`,
      action: onViewAttendance
        ? { label: "عرض التفاصيل", onClick: onViewAttendance }
        : undefined,
    });
  }

  return warnings;
}
