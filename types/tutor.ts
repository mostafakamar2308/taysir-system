import { PaymentMethod, PaymentStatus } from "@/types/payment";
import { AttendanceStatus, SessionStatus } from "@/types/session";
import { StudentStatus } from "@/types/student";

export interface TutorAvailability {
  id: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface TutorNote {
  id: number;
  content: string;
  authorName: string;
  createdAt: string;
}

export interface TutorPayment {
  id: number;
  amount: number;
  currency: string;
  status: PaymentStatus;
  method: PaymentMethod | null;
  date: string;
  description: string | null;
}

export interface AssignedStudent {
  id: number;
  name: string;
  age: number;
  status: StudentStatus;
  phone: string | null;
  planTitle: string | null;
  nextSessionDate: string | null;
}

export interface PerformanceMetrics {
  attendanceRate: number;
  retentionRate: number;
  reportAdherence: number;
  reportQuality: number;
  weightedScore: number;
  scoreHint: string;
  scoreColor: string;
}

// ---------- NEW: one row = one student in a session ----------
export interface TutorSession {
  sessionId: number;
  participantId: number;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  status: SessionStatus;
  topic: string | null;
  studentId: number;
  studentName: string;
  attendance: {
    status: AttendanceStatus | null;
    reason: string | null;
  };
  report: {
    id: number;
    rating: number | null;
    outcomes: string | null;
    strengths: string | null;
    weaknesses: string | null;
    nextGoals: string | null;
    comments: string | null;
  } | null;
}

export interface GroupSummary {
  id: number;
  title: string;
  nextSessionDate: string | null;
  latestSessionDate: string | null;
  members: { id: number; name: string }[];
}

export interface TutorProfile {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  timezone: string;
  active: boolean;
  specialities: string[];
  baseHourlyRate: number;
  baseGroupHourlyRate: number;
  zoomUrl: string | null;
  currency: string;
  groups: GroupSummary[];
  monthlyStats: {
    totalSessions: number;
    attendedSessions: number;
    attendanceRate: number;
    totalEarnings: number;
    paid: number;
    pending: number;
  };
  performanceMetrics: {
    attendanceRate: number;
    reportAdherence: number;
    reportQuality: number;
    homeworkGradingCount: number; // NEW
    weightedScore: number;
    scoreHint: string;
    scoreColor: string;
  };
}

// For the sessions tab (weekly cards)
export interface TutorSessionCardData {
  id: number;
  sessionId: number;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  status: SessionStatus;
  topic: string | null;
  groupName: string;
  isCompleted: boolean;
  attendanceCount: number;
  totalParticipants: number;
  reportCount: number;
  homeworkSubmissions: number;
  homeworkGraded: number;
  hasAssignment: boolean;
  isTrial: boolean;
  notes: string | null;
}
