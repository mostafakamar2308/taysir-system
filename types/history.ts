export enum TargetType {
  SuperAdmin,
  Admin,
  Supervisor,
  Tutor,
  Student,
  Session,
}

export enum HistoryActionType {
  LeadCreated,
  LeadToTrial,
  TrialToSubscription,
  LeadToSubscription,
  UrgentStudentContact,
  TutorReportReminder,
  StudentAbscenceReminder,
  StudentLatePaymentReminder,
  StudentNearEndSubscriptionReminder,
  StudentTutorChange,
  StudentPlanChange,
}

export type HistoryChange =
  | { oldStatus: number; newStatus: number }
  | { oldTutorId: number | null; newTutorId: number };

export type HistoryMetadata =
  | { conversionDate: string }
  | { changeDate: string }
  | { reason: string; date: string }
  | {
      amount: number;
      dueDate: string;
      date: string;
    }
  | {
      endDate: string;
      date: string;
    };

export type History = {
  id: number;
  targetType: TargetType;
  targetId: number;
  action: HistoryActionType;
  changes?: HistoryChange;
  metadata?: HistoryMetadata;
  recordedBy: number;
  recorderType: number;
  academyId: number;
  createdAt: Date;
  updatedAt: Date;
};
