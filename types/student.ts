export type DashboardStudent = {
  id: number;
  name: string;
  email: string;
  age: number;
  phone: string;
  country: string;
  timezone: string;
  status: StudentStatus;
  tutorName: string;
  tutorId?: number;
  startDate: Date;
  currentProgram?: string;
  renewalDate: Date | null;
  plan?: number;
  planName?: string;
};

export enum StudentStatus {
  lead,
  trial,
  subscribed,
  churned,
  paused,
}
