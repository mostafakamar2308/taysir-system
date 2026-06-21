export interface SessionClientData {
  id: number;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  status: number;
  topic: string | null;
  notes: string | null;
  tutorId: number;
  tutorName: string;
  isTrial: boolean;
  studentName: string; // joined names of all participants
  zoomMeetingId: string | null;
  zoomJoinUrl: string | null;
  zoomStartUrl: string | null;
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
  assignmentStats?: {
    hasAssignment: boolean;
    uploadedCount: number;
    gradedCount: number;
    totalParticipants: number;
  };
}
