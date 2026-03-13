export interface ProgramTopic {
  id: number;
  programId: number;
  title: string;
  description: string | null;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface StudentProgramEnrollment {
  id: number;
  studentId: number;
  programId: number;
  enrolledAt: Date;
  completedAt: Date | null;
  status: number; // 0=active, 1=completed, 2=dropped
  student?: { name: string };
  program?: { name: string };
  topics?: StudentTopicProgress[];
}

export interface StudentTopicProgress {
  id: number;
  enrollmentId: number;
  topicId: number;
  completed: boolean;
  completedAt: Date | null;
  notes: string | null;
  sessionId: number | null;
  topic?: ProgramTopic;
}

export interface ProgramWithStats extends Program {
  topics: ProgramTopic[];
  enrollmentCount: number;
}

export interface EnrollmentWithProgress extends StudentProgramEnrollment {
  topics: (StudentTopicProgress & { topic: ProgramTopic })[];
  student: { id: number; name: string };
}

export interface ProgramTopic {
  id: number;
  programId: number;
  title: string;
  description: string | null;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface StudentEnrollment {
  id: number;
  studentId: number;
  student: { id: number; name: string };
  programId: number;
  enrolledAt: Date;
  completedAt: Date | null;
  status: number; // 0=active, 1=completed, 2=dropped
  topics: {
    id: number;
    enrollmentId: number;
    topicId: number;
    completed: boolean;
    completedAt: Date | null;
    notes: string | null;
    sessionId: number | null;
    topic: ProgramTopic;
  }[];
}

export interface Program {
  id: number;
  name: string;
  description: string | null;
  level: string | null;
  duration: number | null;
  academyId: number;
  createdAt: Date;
  updatedAt: Date;
  topics: ProgramTopic[];
  enrollments: StudentEnrollment[];
}
