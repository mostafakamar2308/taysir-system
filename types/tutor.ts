import { PaymentMethod, PaymentStatus } from "@/types/payment";
import { AttendanceStatus, SessionStatus } from "@/types/session";
import { StudentStatus } from "@/types/student";

export interface DashboardTutor {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: boolean; // active
  specialities: string[];
  pricePerSession: number;
  timezone: string;
  createdAt: Date;
  studentCount: number;
  currency: string;
  zoomAuthenticated: boolean;
  timetable: {
    day: string; // day of week (0-6) or name
    from: string;
    to: string;
  }[];
}

export interface TutorAvailability {
  id: number;
  dayOfWeek: number;
  startTime: string; // HH:mm
  endTime: string;
}

export interface TutorNote {
  id: number;
  content: string;
  authorName: string;
  createdAt: string;
}

export interface TutorSession {
  id: number;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  status: SessionStatus;
  topic: string | null;
  studentId: number;
  studentName: string;
  attendance?: {
    id: number;
    tutorAttendance: AttendanceStatus;
    studentAttendance: AttendanceStatus;
    reason: string | null;
  };
  report?: TutorSessionReport;
}

export interface TutorSessionReport {
  id: number;
  outcomes: string | null;
  strengths: string | null;
  weaknesses: string | null;
  nextGoals: string | null;
  comments: string | null;
  rating: number | null;
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

export interface TutorProfile {
  id: number;
  name: string;
  email: string;
  academyId: number;
  currencyId: number;
  phone: string | null;
  currency: string;
  timezone: string;
  academyName: string;
  pricePerSession: number;
  specialities: string[];
  active: boolean;
  bio: string | null;
  qualifications: string | null;
  imageUrl: string | null;
  availabilities: TutorAvailability[];
  students: AssignedStudent[];
  sessions: TutorSession[];
  notes: TutorNote[];
  payments: TutorPayment[];
  monthlyStats: {
    totalSessions: number;
    attendedSessions: number;
    attendanceRate: number;
    totalEarnings: number;
    paid: number;
    pending: number;
  };
  performanceMetrics: PerformanceMetrics;
}
