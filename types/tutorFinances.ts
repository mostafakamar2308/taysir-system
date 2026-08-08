import type { SessionStatus } from "@/types/session";
import type { PaymentStatus } from "@/types/payment";

export type TutorPeriodPreset = "currentMonth" | "prevMonth" | "custom";

export interface TutorPeriod {
  preset: TutorPeriodPreset;
  from: Date;
  to: Date;
}

export interface CurrencySummary {
  id: number;
  code: string;
  symbol: string;
}

export interface TutorSessionInput {
  id: number;
  groupId: number;
  groupTitle: string;
  startTime: string;
  durationMinutes: number;
  tutorRate: number;
  isTrial: boolean;
  cancelledBy: number | null;
  students: { id: number; name: string }[];
}

export interface TutorPaymentInput {
  id: number;
  amount: number;
  currencyId: number;
  currencyCode: string;
  currencySymbol: string;
  method: number | null;
  status: PaymentStatus;
  date: string;
  notes: string | null;
  month: string | null;
  recordedByName: string | null;
}

export interface TutorFinancesInput {
  tutorId: number;
  defaultCurrency: CurrencySummary;
  rateMap: Record<number, number>;
  sessions: TutorSessionInput[];
  payments: TutorPaymentInput[];
  /** Optional reference instant used by the pure engine (defaults to now). */
  now?: Date;
}

export interface TutorGroupBreakdownRow {
  groupId: number;
  groupTitle: string;
  rate: number;
  sessionCount: number;
  totalMinutes: number;
  earnings: number;
}

export interface TutorPeriodBreakdownRow {
  month: string;
  earned: number;
  paid: number;
  outstanding: number;
  sessionCount: number;
}

export interface TutorSessionEarnings {
  id: number;
  groupId: number;
  groupTitle: string;
  startTime: string;
  durationMinutes: number;
  tutorRate: number;
  isTrial: boolean;
  status: SessionStatus;
  students: { id: number; name: string }[];
  earnings: number;
  payable: boolean;
  paid: boolean;
  month: string;
}

export interface TutorPaymentHistoryItem {
  id: number;
  amount: number;
  amountInDefault: number;
  currencyCode: string;
  currencySymbol: string;
  month: string | null;
  method: number | null;
  status: PaymentStatus;
  date: string;
  notes: string | null;
  recordedByName: string | null;
}

export interface TutorFinancialSummary {
  tutorId: number;
  defaultCurrency: CurrencySummary;
  period: {
    from: string;
    to: string;
    preset: TutorPeriodPreset;
  };
  earned: number;
  paid: number;
  outstanding: number;
  payableSessionCount: number;
  byGroup: TutorGroupBreakdownRow[];
  byPeriod: TutorPeriodBreakdownRow[];
  sessions: TutorSessionEarnings[];
  paymentHistory: TutorPaymentHistoryItem[];
  totalOutstanding: number;
}
