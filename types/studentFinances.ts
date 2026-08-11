import { SubscriptionStatus } from "@/types/subscription";

export type SubscriptionCycleState = "upcoming" | "due" | "overdue" | "paid";

export interface StudentFinancialGroup {
  groupStudentId: number;
  groupId: number;
  groupTitle: string;
  membershipActive: boolean;
}

export interface SubscriptionFinancial {
  id: number;
  groupStudentId: number;
  groupId: number;
  groupTitle: string;
  planId: number | null;
  planTitle: string | null;
  price: number;
  currencyCode: string;
  currencySymbol: string;
  sessionCount: number | null;
  sessionsUsed: number;
  sessionsRemaining: number | null;
  sessionsOverCount: number;
  extraSessionsCost: number;
  billingCycle: number;
  startDate: string;
  endDate: string | null;
  nextBillingDate: string | null;
  status: SubscriptionStatus;
  membershipActive: boolean;
  paidThisCycle: number;
  outstanding: number;
  cycleState: SubscriptionCycleState;
  hasSessionWarning: boolean;
}

export interface PaymentHistoryItem {
  id: number;
  amount: number;
  amountInDefault: number;
  currencyCode: string;
  currencySymbol: string;
  status: number;
  method: number | null;
  date: string;
  dueDate: string | null;
  description: string | null;
  subscriptionId: number | null;
  subscriptionLabel: string | null;
}

export interface FinancialWarning {
  type: "danger" | "warning" | "info";
  message: string;
}

export interface StudentFinancialSummary {
  studentId: number;
  defaultCurrency: { id: number; code: string; symbol: string };
  billingDate: string | null;
  derivedBillingDate: string | null;
  billingDateSource: "custom" | "derived";
  totalDue: number;
  totalPaidCycle: number;
  outstanding: number;
  overdue: number;
  totalPaidHistorical: number;
  activeSubscriptionCount: number;
  inactiveSubscriptionCount: number;
  subscriptions: SubscriptionFinancial[];
  groups: StudentFinancialGroup[];
  paymentHistory: PaymentHistoryItem[];
  warnings: FinancialWarning[];
}
