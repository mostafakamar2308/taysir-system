export interface Report {
  id: number;
  title: string;
  type: string;
  month: string; // YYYY-MM
  generatedAt: Date;
  fileUrl: string | null;
  createdBy: string | null;
  academyId: number;
}

export interface ReportClient {
  id: number;
  title: string;
  type: string;
  month: string;
  generatedAt: string; // ISO date
  fileUrl: string | null;
}

export interface GenerateReportInput {
  month: string;
  type: string;
  academyId: number;
}
