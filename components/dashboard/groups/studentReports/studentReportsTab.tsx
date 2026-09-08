"use client";

import { useState } from "react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Download, Pencil, Plus, FileUp } from "lucide-react";
import type { StudentReportItem } from "@/types/studentReport";
import { formatDate } from "@/lib/dates";
import AddStudentReportDialog from "./addStudentReportDialog";

interface Props {
  reports: StudentReportItem[];
  studentId: number;
  studentName?: string;
  canCreate?: boolean;
  canEdit?: boolean;
}

export default function StudentReportsTab({
  reports,
  studentId,
  studentName,
  canCreate = false,
  canEdit = false,
}: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<StudentReportItem | null>(null);

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (report: StudentReportItem) => {
    setEditing(report);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <CardTitle className="text-lg">التقارير</CardTitle>
        {canCreate && (
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4 ml-2" />
            إضافة تقرير
          </Button>
        )}
      </div>

      {reports.length === 0 ? (
        <Card>
          <CardContent className="p-8 flex flex-col items-center gap-2 text-muted-foreground">
            <FileText className="h-10 w-10 opacity-50" />
            <p className="text-sm">لا توجد تقارير بعد</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reports.map((report) => (
            <Card key={report.id}>
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-semibold">{report.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(report.createdAt)} • {report.authorName}
                      {report.updatedAt !== report.createdAt &&
                        report.lastEditorName && (
                          <span>
                            {" "}
                            (آخر تعديل: {report.lastEditorName})
                          </span>
                        )}
                    </p>
                  </div>
                  {canEdit && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEdit(report)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>

                {report.content && (
                  <p className="text-sm whitespace-pre-wrap text-foreground leading-relaxed">
                    {report.content}
                  </p>
                )}

                {report.hasFile && (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="gap-1">
                      <FileUp className="h-3.5 w-3.5" />
                      {report.originalFileName ?? "ملف"}
                    </Badge>
                    <a
                      href={`/api/file/student-report/${report.id}`}
                      download
                      className="text-primary underline text-sm flex items-center gap-1"
                    >
                      <Download className="h-4 w-4" /> تحميل
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AddStudentReportDialog
        studentId={studentId}
        studentName={studentName}
        report={editing}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={() => {
          setDialogOpen(false);
          setEditing(null);
        }}
      />
    </div>
  );
}