// A report about a student's overall progress written by a tutor/supervisor,
// distinct from per-session SessionReport.
export interface StudentReportItem {
  id: number;
  title: string;
  content: string | null;
  hasFile: boolean;
  originalFileName: string | null;
  createdAt: string;
  updatedAt: string;
  authorName: string;
  lastEditorName: string | null;
}