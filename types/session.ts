export enum SessionStatus {
  SCHEDULED,
  COMPLETED,
  CANCELLED,
}

export enum AttendanceStatus {
  ATTENDED,
  ABSENT_EXCUSED,
  ABSENT_UNEXCUSED,
  LATE,
  CANCELLED,
}

export type DashboardSession = {
  id: number;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  status: number;
  topic: string | null;
  notes: string | null;
  studentId: number;
  studentName: string;
  tutorId: number;
  isTrial: boolean;
  tutorName: string | null;
  zoomMeetingId?: string | null;
  zoomJoinUrl?: string | null;
  zoomStartUrl?: string | null;
  attendance:
    | {
        id: number;
        tutorAttendance: number;
        studentAttendance: number;
        reason: string | null;
      }
    | undefined;
  report?: {
    id: number;
    rating: number | null;
    outcomes: string | null;
    strengths: string | null;
    weaknesses: string | null;
    nextGoals: string | null;
    comments: string | null;
  };
};
