import type { SessionStatus } from "@/types/session";

export interface StudentInGroup {
  studentId: number;
  studentName: string;
  phone: string;
  status?: number; // StudentStatus — omitted in read-only views
  remainingSessions?: number | null; // null = no countable active subscription — omitted in read-only views
  active?: boolean; // membership active — omitted in read-only views
}

export interface GroupDetail {
  id: number;
  title: string;
  createdAt: string; // ISO
  tutorId: number;
  tutorName: string;
  effectiveHourlyRate: number;
  studentCount: number; // total members (all)
  activeStudentCount: number;
  students: StudentInGroup[];
  performances: {
    studentId: number;
    studentName: string;
    averageRating: number | null;
  }[];
  sessions: GroupSession[];
}

export interface GroupSession {
  id: number;
  startTime: string;
  endTime: string;
  status: SessionStatus;
  topic: string | null;
  tutorAttendanceStatus: number | null; // from TutorAttendance model
  attendanceCount: number; // participants with attendance marked
  totalParticipants: number;
  reportCount: number; // participants with report
  recordingLink: string | null;
  participants: {
    studentId: number;
    studentName: string;
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
