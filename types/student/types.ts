export interface SessionItem {
  id: number;
  participantId: number;
  startTime: string;
  endTime: string;
  topic: string | null;
  tutorName: string;
  status: number;
  attendance: number | null;
  hasReport: boolean;
}

export interface NextSession {
  id: number;
  startTime: string;
  endTime: string;
  tutorName: string;
  zoomJoinUrl: string | null;
  topic: string | null;
}

export interface MonthlyAnalytics {
  totalMonthlySessions: number;
  remainingMonthlySessions: number;
  renewalDate: string | null;
}

export interface ReportData {
  rating: number | null;
  outcomes: string | null;
  strengths: string | null;
  weaknesses: string | null;
  nextGoals: string | null;
}

export interface LastReport {
  sessionDate: string;
  topic: string | null;
  report: ReportData;
}

export interface StudentInfo {
  id: number;
  name: string;
  timezone: string;
  imageUrl: string | null;
  tutorName: string | null;
  plan: {
    title: string;
    sessionsPerWeek: number;
    price: number;
    currency: string;
    billingPeriod: number;
  } | null;
}

export interface PaymentRecord {
  amount: number;
  currency: string;
  status: number;
  date: string;
  method: number | null;
}

export interface ActiveSubscription {
  id: number;
  planTitle: string;
  planSessionsPerWeek: number;
  planPrice: number;
  planCurrency: string;
  startDate: string;
  endDate: string | null;
  payments: PaymentRecord[];
}

export interface AssignmentData {
  id: number;
  title: string | null;
  description: string | null;
  deadline: string | null;
  maxScore: number;
  filePath: string;
  originalFileName: string;
}

export interface SolutionData {
  id: number;
  filePath: string;
  originalFileName: string;
  score: number | null;
  feedback: string | null;
  submittedAt: string;
  gradedAt: string | null;
}

export interface SessionWithAssignment extends SessionItem {
  assignment: AssignmentData | null;
  solution: SolutionData | null;
}

export interface StudentDashboardProps {
  student: StudentInfo;
  nextSession: NextSession | null;
  monthlyAnalytics: MonthlyAnalytics;
  lastReport: LastReport | null;
  sessions: SessionWithAssignment[];
  reports: {
    sessionDate: string;
    topic: string | null;
    rating: number | null;
    outcomes: string | null;
    strengths: string | null;
    weaknesses: string | null;
    nextGoals: string | null;
  }[];
  activeSubscription: ActiveSubscription | null;
  defaultCurrency: { code: string; symbol: string; name: string };
  pendingAssignmentsCount: number;
  lastAssignment: {
    participantId: number;
    sessionDate: string;
    topic: string | null;
    assignment: AssignmentData;
    solution: SolutionData | null;
  } | null;
}
