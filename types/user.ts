export enum Role {
  SuperAdmin,
  Admin,
  Supervisor,
  Tutor,
  Student,
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: number;
  timezone: string;
  preferredLanguage: string | null;
  active: boolean;
  academyId: number | null;
  createdAt: Date;
}
