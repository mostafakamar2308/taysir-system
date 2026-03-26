import { PaymentMethod, PaymentStatus } from "@/types/payment";

export interface PaymentRecord {
  id: number;
  amount: number;
  currency: string;
  status: number;
  method: number | null;
  date: string;
  dueDate: string | null;
  description: string | null;
  studentId: number;
  amountInDefault: number;
  studentName: string;
  planId: number | null;
  recordedBy: number | null;
  invoiceUrl: string | null;
  channel: string | null;
  currencyId: number;
  notes: string | null;
}

export interface SalaryCalculation {
  tutorId: number;
  tutorName: string;
  sessionsCount: number;
  pricePerSession: number;
  total: number;
  paid: number;
  remaining: number;
  currencyId: number;
}

export interface ExpenseRecord {
  id: number;
  date: string;
  description: string;
  costCenter: string | null;
  amountInDefault: number;
  amount: number;
  currencyId: number;
  currency: string;
  method: PaymentMethod | null;
  status: PaymentStatus;
  invoiceUrl: string | null;
  notes: string | null;
  tutorId: number | null;
  salaryMonth: string | null;
  tutorName: string | null;
  paid?: boolean;
}

export interface StudentOption {
  id: number;
  name: string;
}

export interface TutorOption {
  id: number;
  name: string;
}

export interface PlanOption {
  id: number;
  title: string;
}

export interface SalaryCalculation {
  tutorId: number;
  tutorName: string;
  sessionsCount: number;
  pricePerSession: number;
  total: number;
  existingExpense: ExpenseRecord | null;
}

export interface PaymentFormData {
  amount: number;
  currency: string;
  status: number;
  method: number | null;
  date: string;
  dueDate: string | null;
  description: string | null;
  studentId: number;
  planId: number | null;
  recordedBy: string | null;
  invoiceUrl: string | null;
  channel: string | null;
  notes: string | null;
  academyId: number;
}

export interface ExpenseFormData {
  date: string;
  description: string;
  costCenter: string | null;
  amount: number;
  currency: string;
  paymentMethod: number | null;
  paid: boolean;
  reference: string | null;
  notes: string | null;
  tutorId: number | null;
  salaryMonth: string | null;
  academyId: number;
}
