"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { attendanceStatusColors, attendanceStatusLabels } from "@/lib/enums";
import type { GroupSession } from "@/types/groupDetails";
import { AttendanceStatus } from "@/types/session";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: GroupSession;
}

export default function SessionAttendanceDialog({
  open,
  onOpenChange,
  session,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-lg max-h-[80vh] overflow-y-auto"
        dir="rtl"
      >
        <DialogHeader>
          <DialogTitle>تفاصيل الحضور والتقارير</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="attendance">
          <TabsList className="w-full">
            <TabsTrigger value="attendance" className="flex-1">
              الحضور
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex-1">
              التقارير
            </TabsTrigger>
          </TabsList>

          <TabsContent value="attendance" className="space-y-3 mt-4">
            {session.participants.map((p) => (
              <div
                key={p.studentId}
                className="flex items-center justify-between"
              >
                <span>{p.studentName}</span>
                {p.attendanceStatus != null ? (
                  <Badge
                    className={
                      attendanceStatusColors[
                        p.attendanceStatus as AttendanceStatus
                      ]
                    }
                  >
                    {
                      attendanceStatusLabels[
                        p.attendanceStatus as AttendanceStatus
                      ]
                    }
                  </Badge>
                ) : (
                  <span className="text-amber-600 text-sm">غير مسجل</span>
                )}
              </div>
            ))}
          </TabsContent>

          <TabsContent value="reports" className="space-y-3 mt-4">
            {session.participants.map((p) => (
              <div key={p.studentId} className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{p.studentName}</span>
                  {p.report ? (
                    <Badge
                      variant="secondary"
                      className="bg-green-100 text-green-700"
                    >
                      مكتمل
                    </Badge>
                  ) : (
                    <span className="text-red-600 text-sm">غير مكتوب</span>
                  )}
                </div>
                {p.report && (
                  <div className="text-sm space-y-1">
                    {p.report.rating && <p>التقييم: {p.report.rating}/5</p>}
                    {p.report.outcomes && <p>النتائج: {p.report.outcomes}</p>}
                    {p.report.strengths && (
                      <p>نقاط القوة: {p.report.strengths}</p>
                    )}
                    {p.report.weaknesses && (
                      <p>نقاط الضعف: {p.report.weaknesses}</p>
                    )}
                    {p.report.nextGoals && (
                      <p>الأهداف القادمة: {p.report.nextGoals}</p>
                    )}
                    {p.report.comments && <p>ملاحظات: {p.report.comments}</p>}
                  </div>
                )}
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
