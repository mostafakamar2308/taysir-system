export interface GroupMemberInfo {
  studentId: number;
  studentName: string;
  active: boolean;
}

export interface DashboardGroup {
  id: number;
  title: string;
  academyId: number;
  currentTutorId: number;
  currentTutorName: string;
  baseHourlyRate: number;
  baseGroupHourlyRate: number;
  tutorHourlyRate: number | null;
  active: boolean;
  activeStudentsCount: number;
  nextSessionDate: string | null;
  latestSessionDate: string | null;
  members: GroupMemberInfo[];
}

export interface TutorOption {
  id: number;
  name: string;
  baseGroupHourlyRate: number;
}
export interface StudentOption {
  id: number;
  name: string;
}
