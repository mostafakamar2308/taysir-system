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
export interface AdminSessionClientData {
  id: number;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  status: number;
  topic: string | null;
  notes: string | null;
  tutorId: number;
  tutorName: string | null;
  isTrial: boolean;
  studentId: number | null; // first participant's ID (backward compat)
  studentName: string; // joined names
  studentPhone: string | null;
  zoomMeetingId: string | null;
  zoomJoinUrl: string | null;
  zoomStartUrl: string | null;
  attendance?: {
    // first participant's attendance (backward compat)
    id: number;
    tutorAttendance: number | null;
    studentAttendance: number | null;
    reason: string | null;
  };
  report?: {
    // first participant's report (backward compat)
    id: number;
    rating: number | null;
    outcomes: string | null;
    strengths: string | null;
    weaknesses: string | null;
    nextGoals: string | null;
    comments: string | null;
  };
  participants: {
    participantId: number;
    studentId: number;
    studentName: string;
    studentPhone: string | null;
    attendanceStatus: number | null;
    report: {
      id: number;
      rating: number | null;
      outcomes: string | null;
      strengths: string | null;
      weaknesses: string | null;
      nextGoals: string | null;
      comments: string | null;
    } | null;
  }[];
}
