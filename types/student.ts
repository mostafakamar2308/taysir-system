export type DashboardStudent = {
  id: number;
  name: string;
  email: string;
  age: number;
  phone: string;
  country: string;
  timezone: string;
  status: number;
  tutorName: string;
  startDate: Date;
  renewalDate: Date | null;
  plan?: number;
};
