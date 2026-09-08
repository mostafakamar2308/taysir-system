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

export interface AdminSession {
  id: number;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  topic: string | null;
  isTrial: boolean;
  cancelledBy: number | null;

  status: SessionStatus;

  zoomUrl: string | null;
  recordingLink: string | null;

  groupId: number;
  groupName: string;

  tutorId: number;
  tutorName: string;
  tutorRate: number;
  tutorAttendance: AdminSessionTutorAttendance | null;

  supervisorId: number;
  supervisorName: string;

  participants: AdminSessionParticipant[];
  assignment: SessionAssignment | null;

  createdAt: string;
}

export interface AdminSessionTutorAttendance {
  id: number;
  name: string | null;
  status: AttendanceStatus;
  notes: string | null;
  reviewedAt: string | null;
}

export interface AdminSessionParticipant {
  id: number;
  studentId: number;
  name: string | null;
  status: AttendanceStatus | null;
  reason: string | null;
  price: number;
  paymentStatus: number;
  report: SessionReport | null;
  homeworkSolution: HomeworkSolution | null;
}

export interface SessionReport {
  id: number;
  rating: number | null;
  outcome: string | null;
  strengths: string | null;
  weaknesses: string | null;
  nextGoals: string | null;
  comments: string | null;
}

export interface SessionAssignment {
  id: number;
  title: string | null;
  description: string | null;
  deadline: string;
  maxScore: number;
  fileUrl: string | null;
}

export interface HomeworkSolution {
  id: number;
  assignmentId: number;
  participantId: number;
  fileUrl: string;
  score: number | null;
  feedback: string | null;
  submittedAt: string;
  gradedAt: string | null;
  gradedBy: number | null;
}

export interface SessionGroup {
  id: number;
  title: string;
  tutorId: number;
  tutorName: string;
  active: boolean;
  activeMembers: {
    id: number;
    name: string;
    sessionsRemaining: number | null;
  }[];
}

export interface SessionStudent {
  id: number;
  name: string;
  sessionsRemaining: number | null;
  tutorId: number | null;
  tutorName: string | null;
}
