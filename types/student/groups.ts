export interface StudentGroupSummary {
  id: number;
  title: string;
  tutorName: string;
  isPrivate: boolean;
  active: boolean;
  averageRating: number | null;
  reportCount: number;
  nextSessionDate: string | null;
  latestSessionDate: string | null;
}

export interface StudentGroupSession {
  id: number;
  startTime: string;
  endTime: string;
  status: number;
  topic: string | null;
  tutorName: string;
  attendanceStatus: number | null;
  report: {
    rating: number | null;
    outcomes: string | null;
    strengths: string | null;
    weaknesses: string | null;
    nextGoals: string | null;
    comments: string | null;
  } | null;
}

export interface StudentGroupDetail {
  id: number;
  title: string;
  createdAt: string;
  tutorName: string;
  isPrivate: boolean;
  active: boolean;
  studentCount: number;
  averageRating: number | null;
  reportCount: number;
  latestRating: number | null;
  ratings: { sessionDate: string; rating: number }[];
  sessions: StudentGroupSession[];
}