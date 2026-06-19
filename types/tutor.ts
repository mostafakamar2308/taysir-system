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

// ---------- TutorProfile ----------
export interface TutorProfile {
  id: number;
  name: string;
  email: string;
  academyId: number;
  currencyId: number;
  phone: string | null;
  currency: string;
  timezone: string;
  zoomUrl: string | null;
  zoomAuthenticated: boolean;
  academyName: string;
  privatePricePerHour: number;
  groupPricePerHour: number;
  specialities: string[];
  active: boolean;
  bio: string | null;
  qualifications: string | null;
  imageUrl: string | null;
  availabilities: TutorAvailability[];
  students: AssignedStudent[];
  sessions: TutorSession[]; // flattened per‑student rows
  notes: TutorNote[];
  payments: TutorPayment[];
  monthlyStats: {
    totalSessions: number;
    attendedSessions: number; // sessions where at least one student attended (or tutor? we'll keep old logic)
    attendanceRate: number;
    totalEarnings: number;
    paid: number;
    pending: number;
  };
  performanceMetrics: PerformanceMetrics;
}
