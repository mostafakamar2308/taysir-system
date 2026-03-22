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
  studentName: string;
  planId: number | null;
  recordedBy: string | null;
  invoiceUrl: string | null;
  channel: string | null;
  notes: string | null;
}

export interface ExpenseRecord {
  id: number;
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
  tutorName: string | null;
  salaryMonth: string | null;
}

export interface StudentOption {
  id: number;
  name: string | null;
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
