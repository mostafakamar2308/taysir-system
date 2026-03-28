import { SessionStatus, AttendanceStatus } from "@/types/session";

export const sessionStatusLabels: Record<SessionStatus, string> = {
  [SessionStatus.SCHEDULED]: "مجدول",
  [SessionStatus.COMPLETED]: "مكتمل",
  [SessionStatus.CANCELLED]: "ملغي",
};

export const sessionStatusColors: Record<SessionStatus, string> = {
  [SessionStatus.SCHEDULED]: "bg-blue-100 text-blue-700 border-blue-200",
  [SessionStatus.COMPLETED]: "bg-primary/10 text-primary border-primary/20",
  [SessionStatus.CANCELLED]:
    "bg-destructive/10 text-destructive border-destructive/20",
};

export const attendanceStatusLabels: Record<AttendanceStatus, string> = {
  [AttendanceStatus.ATTENDED]: "حضر",
  [AttendanceStatus.ABSENT_EXCUSED]: "غياب بعذر",
  [AttendanceStatus.ABSENT_UNEXCUSED]: "غياب بدون عذر",
  [AttendanceStatus.LATE]: "متأخر",
  [AttendanceStatus.CANCELLED]: "ملغي",
};

export const attendanceStatusColors: Record<AttendanceStatus, string> = {
  [AttendanceStatus.ATTENDED]: "bg-primary/10 text-primary",
  [AttendanceStatus.ABSENT_EXCUSED]: "bg-amber-100 text-amber-700",
  [AttendanceStatus.ABSENT_UNEXCUSED]: "bg-destructive/10 text-destructive",
  [AttendanceStatus.LATE]: "bg-orange-100 text-orange-700",
  [AttendanceStatus.CANCELLED]: "bg-muted text-muted-foreground",
};
