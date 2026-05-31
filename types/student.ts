import { Student, User, Tutor, Plan } from "@/generated/prisma/browser";
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
  currentProgram?: string;
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

// Type for tutor with user (password omitted)
type TutorWithUser = Tutor & {
  user: Omit<User, "password">;
};

// Type for student with all includes
export type GetStudentResult = Student & {
  user: User;
  tutor: TutorWithUser | null;
  plan: Plan | null;
};
