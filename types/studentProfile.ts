export interface Plan {
  id: number;
  title: string;
  sessionsPerWeek: number;
  price: number;
  billingPeriod: number;
  currency?: string;
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
  authorName: string; // from author.name
  createdAt: string; // ISO string
}

export interface SessionRecord {
  id: number;
  startTime: string; // ISO string
  endTime: string;
  durationMinutes: number;
  status: number; // SessionStatus enum int
  topic: string | null;
  notes: string | null;
  studentId: number;
  studentName: string;
  tutorId: number;
  tutorName: string | null;
  attendance?: {
    id: number;
    status: number; // AttendanceStatus enum int
    reason: string | null;
  };
  recurringPatternId: number | null;
  report: Report;
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
  status: number; // StudentStatus enum int
  startDate: string;
  renewalDate: string | null;
  source: string | null;
  currentProgram: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  preferredLanguage: string | null;
  imageUrl: string | null;
  tutorId: number | null;
  tutorName: string | null;
  planId: number | null;
  plan: Plan | null;
  availabilities: Availability[];
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
  autoRenew: boolean;
  payments: {
    id: number;
    amount: number;
    date: string;
    status: number;
  }[];
};
