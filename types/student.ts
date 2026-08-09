import { User } from "@/generated/prisma/browser";

export type DashboardStudentGroup = {
  groupId: number;
  groupTitle: string;
  tutorId: number;
  tutorName: string;
  isPrivate: boolean;
};

export type DashboardStudent = {
  id: number;
  name: string;
  email: string;
  age: number;
  phone: string;
  country: string;
  timezone: string;
  status: StudentStatus;
  creditBalance: number;
  sessionsUsed: number;
  sessionsTotal: number | null;
  groups: DashboardStudentGroup[];
};

export enum StudentStatus {
  lead,
  trial,
  subscribed,
  churned,
  paused,
}

// Shape returned by getStudent action (used by the edit dialog)
export type GetStudentResult = {
  id: number;
  age: number;
  country: string | null;
  source: string | null;
  currencyId: number;
  user: Omit<User, "password">;
  groupMemberships: {
    id: number;
    groupId: number;
    groupTitle: string;
    tutorId: number;
    tutorName: string;
    isPrivate: boolean;
  }[];
};
