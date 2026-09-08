export interface SessionParticipantSummary {
  id: number;
  studentId: number;
  studentName: string;
  studentPhone?: string | null;
  attendanceStatus: number | null;
  hasReport: boolean;
}

export interface SessionSummary {
  id: number;
  startTime: string;
  endTime: string;
  topic: string | null;
  status: number;
  participants: SessionParticipantSummary[];
  hasAnyAttendanceMissing: boolean;
  hasAnyReportMissing: boolean;
  hasAnyRecordingLinkMissing: boolean;
  meetingLink?: string | null;
  recordingLink?: string | null;
}
