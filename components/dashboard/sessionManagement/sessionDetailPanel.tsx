"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { sessionStatusLabels, sessionStatusColors } from "@/const/sessions";
import type { DashboardSession, SessionStatus } from "@/types/session";
import { getSessionDetails } from "@/actions/sessions";
import dayjs from "@/lib/dayjs";

interface SessionDetailPanelProps {
  sessionId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SessionDetailPanel({
  sessionId,
  open,
  onOpenChange,
}: SessionDetailPanelProps) {
  const [session, setSession] = useState<DashboardSession | null>(null);
  const [loading, setLoading] = useState(false);

  const handleOpenChange = (isOpen: boolean) => {
    onOpenChange(isOpen);
    if (isOpen && sessionId) {
      setSession(null); // إعادة تعيين
      setLoading(true);
      getSessionDetails(sessionId)
        .then(setSession)
        .finally(() => setLoading(false));
    } else {
      setSession(null);
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle>تفاصيل الجلسة</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-36" />
          </div>
        ) : session ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="font-semibold">الحالة:</span>
              <Badge
                className={sessionStatusColors[session.status as SessionStatus]}
              >
                {sessionStatusLabels[session.status as SessionStatus]}
              </Badge>
            </div>

            <div>
              <span className="font-semibold">الطالب: </span>
              {session.studentName}
            </div>
            <div>
              <span className="font-semibold">المعلم: </span>
              {session.tutorName}
            </div>
            <div>
              <span className="font-semibold">التاريخ والوقت: </span>
              {dayjs(session.startTime).format("YYYY/MM/DD")} –{" "}
              {dayjs(session.startTime).format("hh:mm A")} حتى{" "}
              {dayjs(session.endTime).format("hh:mm A")}
            </div>
            <div>
              <span className="font-semibold">الموضوع: </span>
              {session.topic || "—"}
            </div>
            {session.notes && (
              <div>
                <span className="font-semibold">ملاحظات: </span>
                {session.notes}
              </div>
            )}
            {session.attendance && (
              <div>
                <span className="font-semibold">الحضور: </span>
                <span>
                  {attendanceLabel(session.attendance.studentAttendance)} (
                  {session.attendance.reason || "بدون سبب"})
                </span>
              </div>
            )}
            {session.report && (
              <div>
                <span className="font-semibold">التقرير: </span>
                {session.report.rating && (
                  <span>التقييم {session.report.rating}/5</span>
                )}
                <p className="text-sm text-muted-foreground mt-1">
                  {session.report.comments}
                </p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-muted-foreground">لم يتم العثور على الجلسة</p>
        )}
      </DialogContent>
    </Dialog>
  );
}

function attendanceLabel(status: number) {
  switch (status) {
    case 0:
      return "حاضر";
    case 3:
      return "متأخر";
    case 1:
      return "غائب بعذر";
    case 2:
      return "غائب بدون عذر";
    default:
      return "";
  }
}
