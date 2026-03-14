export interface Academy {
  id: number;
  name: string;
  adminId: string | null;
  adminName: string | null;
  maxStudents: number | null;
  maxTutors: number | null;
  primaryColor: string | null;
  createdAt: Date;
  studentCount: number;
  tutorCount: number;
}

export interface AcademyFormData {
  name: string;
  adminId?: string | null;
  maxStudents?: number | null;
  maxTutors?: number | null;
  primaryColor?: string | null;
}
