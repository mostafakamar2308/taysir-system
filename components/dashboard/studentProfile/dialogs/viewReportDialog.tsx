"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface ViewReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report: {
    rating?: number | null;
    outcomes?: string | null;
    strengths?: string | null;
    weaknesses?: string | null;
    nextGoals?: string | null;
    comments?: string | null;
  };
  sessionDate: string;
}

export default function ViewReportDialog({
  open,
  onOpenChange,
  report,
  sessionDate,
}: ViewReportDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>تقرير الحصة</DialogTitle>
          <p className="text-sm text-muted-foreground">{sessionDate}</p>
        </DialogHeader>
        <div className="space-y-3">
          {report.rating && (
            <div>
              <p className="text-sm font-medium">التقييم</p>
              <Badge variant="outline">{report.rating} / 5</Badge>
            </div>
          )}
          {report.outcomes && (
            <div>
              <p className="text-sm font-medium">النتائج</p>
              <p className="text-sm text-muted-foreground">{report.outcomes}</p>
            </div>
          )}
          {report.strengths && (
            <div>
              <p className="text-sm font-medium">نقاط القوة</p>
              <p className="text-sm text-muted-foreground">
                {report.strengths}
              </p>
            </div>
          )}
          {report.weaknesses && (
            <div>
              <p className="text-sm font-medium">نقاط الضعف</p>
              <p className="text-sm text-muted-foreground">
                {report.weaknesses}
              </p>
            </div>
          )}
          {report.nextGoals && (
            <div>
              <p className="text-sm font-medium">الأهداف القادمة</p>
              <p className="text-sm text-muted-foreground">
                {report.nextGoals}
              </p>
            </div>
          )}
          {report.comments && (
            <div>
              <p className="text-sm font-medium">تعليقات</p>
              <p className="text-sm text-muted-foreground">{report.comments}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
