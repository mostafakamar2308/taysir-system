import { StudentStatus } from "@/types/student";

export interface Availability {
  id: number;
  dayOfWeek: number;
  startTime: string; // HH:mm string (converted from DateTime)
  endTime: string;
}

export interface Note {
  id: number;
  content: string;
  authorName: string;
  createdAt: string;
}

export interface SessionRecord {
  id: number;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  status: number;
  topic: string | null;
  notes: string | null;
  tutorId: number;
  tutorName: string;
  groupId: number;
  groupName: string;
  attendance?: {
    id: number;
    status: number | null;
    reason: string | null;
  };
  report?: {
    id: number;
    rating: number | null;
    outcomes: string | null;
    strengths: string | null;
    weaknesses: string | null;
    nextGoals: string | null;
    comments: string | null;
  } | null;
  homeworkSolution?: {
    id: number;
    score: number | null;
    submittedAt: string;
    gradedAt: string | null;
  } | null;
}

export interface Payment {
  id: number;
  amount: number;
  currency: string;
  status: number; // PaymentStatus enum int
  method: number | null; // PaymentMethod enum int
  date: string; // ISO string
  dueDate: string | null;
  description: string | null;
  studentId: number;
  planId: number | null;
  invoiceUrl: string | null;
}

export interface StudentProfile {
  id: number;
  name: string;
  email: string | null;
  age: number;
  phone: string | null;
  country: string | null;
  timezone: string;
  status: StudentStatus;
  creditBalance: number;
  sessionsUsed: number;
  sessionsTotal: number | null;
  source: string | null;
  academyId: number;
  currencyId: number;
  currencySymbol: string;
  preferredLanguage: string | null;
  groups: {
    tutorId: number;
    tutorUserId: number;
    tutorName: string;
    isPrivate: boolean;
  }[];
  notes: Note[];
  payments: Payment[];
  sessions: SessionRecord[];
}
export type Report = {
  id: number;
  rating: number | null;
  outcomes: string | null;
  strengths: string | null;
  weaknesses: string | null;
  nextGoals: string | null;
  comments: string | null;
} | null;
