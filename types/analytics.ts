export interface MonthlyData {
  month: string;
  label: string;
  value: number;
}

export interface TutorAttendanceData {
  tutorId: number;
  tutorName: string;
  attendanceRate: number;
  totalSessions: number;
}

export interface StudentProgressData {
  studentId: number;
  studentName: string;
  programName: string;
  completedTopics: number;
  totalTopics: number;
  attendanceRate: number;
}

export interface ProgramCompletionData {
  name: string;
  value: number;
  fill: string;
}

export interface RevenueExpenseData {
  month: string;
  revenue: number;
  expenses: number;
}
