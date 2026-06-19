import { StudentStatus } from "@/types/student";

export interface Plan {
  id: number;
  title: string;
  sessionsPerWeek: number;
  price: number;
  billingPeriod: number;
  currency: string;
}

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
  // One session per student – their own attendance & report
  attendance?: {
    id: number; // participant id
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
  sessionsBalance: number;
  source: string | null;
  academyId: number;
  preferredLanguage: string | null;
  tutorId: number | null;
  tutorName: string | null;
  planId: number | null;
  plan: Plan | null;
  notes: Note[];
  payments: Payment[];
  subscriptions: Subscription[];
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

export type Subscription = {
  id: number;
  planId: number;
  planTitle: string;
  planSessionsPerWeek: number;
  planPrice: number;
  planCurrency: string;
  startDate: string;
  endDate: string | null;
  status: number;
  pricePerSession: number;
  payments: {
    id: number;
    amount: number;
    date: string;
    status: number;
  }[];
};
