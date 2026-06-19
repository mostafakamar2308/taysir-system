"use client";

import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { getSessionDetailsForManagement } from "@/actions/sessions";
import { AdminSessionClientData } from "@/types/session";
import { sessionStatusLabels, sessionStatusColors } from "@/const/sessions";
import { AttendanceStatus, SessionStatus } from "@/types/session";
import { formatDate, formatTime } from "@/lib/dates";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Copy, ExternalLink, Video } from "lucide-react";

interface Props {
  sessionId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SessionManagementDetailPanel({
  sessionId,
  open,
  onOpenChange,
}: Props) {
  const [session, setSession] = useState<AdminSessionClientData | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Fetch data when dialog opens
  const handleOpenChange = useCallback(
    async (isOpen: boolean) => {
      onOpenChange(isOpen);
      if (isOpen) {
        setLoading(true);
        try {
          const data = await getSessionDetailsForManagement(sessionId);
          setSession(data);
        } catch (error) {
          console.error("Failed to fetch session details:", error);
        } finally {
          setLoading(false);
        }
      } else {
        // Reset when closing
        setSession(null);
        setLoading(false);
      }
    },
    [sessionId, onOpenChange],
  );

  const attendanceBadge = (
    p: AdminSessionClientData["participants"][number],
  ) => {
    if (p.attendanceStatus === null) {
      return (
        <Badge
          variant="outline"
          className="border-amber-300 text-amber-700 bg-amber-50"
        >
          غير مسجل
        </Badge>
      );
    }
    const labels: Record<number, string> = {
      [AttendanceStatus.ATTENDED]: "حاضر",
      [AttendanceStatus.LATE]: "متأخر",
      [AttendanceStatus.ABSENT_EXCUSED]: "غائب بعذر",
      [AttendanceStatus.ABSENT_UNEXCUSED]: "غائب بدون عذر",
    };
    const variant =
      p.attendanceStatus === AttendanceStatus.ATTENDED
        ? "bg-green-100 text-green-700"
        : p.attendanceStatus === AttendanceStatus.LATE
          ? "bg-orange-100 text-orange-700"
          : "bg-red-100 text-red-700";
    return (
      <Badge className={variant}>{labels[p.attendanceStatus] || "?"}</Badge>
    );
  };

  const reportBadge = (p: AdminSessionClientData["participants"][number]) => {
    if (
      p.attendanceStatus !== null &&
      [AttendanceStatus.ATTENDED, AttendanceStatus.LATE].includes(
        p.attendanceStatus,
      ) &&
      !p.report
    ) {
      return (
        <Badge
          variant="outline"
          className="border-blue-300 text-blue-700 bg-blue-50"
        >
          تقرير غير مكتوب
        </Badge>
      );
    }
    if (p.report) {
      return (
        <Badge variant="outline" className="bg-primary/10 text-primary">
          تقرير مكتمل
        </Badge>
      );
    }
    return null;
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-2xl max-h-[90vh] overflow-y-auto"
        dir="rtl"
      >
        <DialogHeader>
          <DialogTitle>تفاصيل الحصة</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-48" />
          </div>
        ) : session ? (
          <Tabs defaultValue="details">
            <TabsList className="flex w-full *:grow">
              <TabsTrigger value="details">التفاصيل</TabsTrigger>
              <TabsTrigger value="participants">الطلاب</TabsTrigger>
              {session.zoomJoinUrl && (
                <TabsTrigger value="zoom">زووم</TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="details" className="space-y-4 mt-4">
              <div className="flex items-center gap-2">
                <Badge
                  className={
                    sessionStatusColors[session.status as SessionStatus]
                  }
                >
                  {sessionStatusLabels[session.status as SessionStatus]}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">الطلاب</p>
                <p className="font-medium">{session.studentName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">المعلم</p>
                <p className="font-medium">{session.tutorName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">الوقت</p>
                <p>
                  {formatDate(session.startTime)} •{" "}
                  {formatTime(session.startTime)} –{" "}
                  {formatTime(session.endTime)}
                </p>
              </div>
              {session.topic && (
                <p>
                  <span className="text-muted-foreground">الموضوع:</span>{" "}
                  {session.topic}
                </p>
              )}
              {session.notes && (
                <p>
                  <span className="text-muted-foreground">ملاحظات:</span>{" "}
                  {session.notes}
                </p>
              )}
            </TabsContent>

            <TabsContent value="participants" className="space-y-6 mt-4">
              {session.participants.map((p) => (
                <div
                  key={p.participantId}
                  className="border rounded-lg p-4 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">{p.studentName}</h4>
                    <div className="flex gap-2">
                      {attendanceBadge(p)}
                      {reportBadge(p)}
                    </div>
                  </div>
                  {p.report && (
                    <div className="text-sm space-y-1 border-t pt-2">
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

            {session.zoomJoinUrl && (
              <TabsContent value="zoom" className="space-y-4 mt-4">
                <div className="flex items-center gap-2 text-primary">
                  <Video className="h-5 w-5" />
                  <span className="font-semibold">زووم</span>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm text-muted-foreground">
                    رابط الانضمام
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={session.zoomJoinUrl || ""}
                      readOnly
                      className="font-mono text-sm"
                      dir="ltr"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        navigator.clipboard.writeText(session.zoomJoinUrl!);
                        toast({ title: "تم النسخ" });
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        window.open(session.zoomJoinUrl!, "_blank")
                      }
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {session.zoomStartUrl && (
                  <div className="space-y-1">
                    <Label className="text-sm text-muted-foreground">
                      رابط البدء
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        value={session.zoomStartUrl || ""}
                        readOnly
                        className="font-mono text-sm bg-muted/50"
                        dir="ltr"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          navigator.clipboard.writeText(session.zoomStartUrl!);
                          toast({ title: "تم النسخ" });
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() =>
                          window.open(session.zoomStartUrl!, "_blank")
                        }
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>
            )}
          </Tabs>
        ) : (
          <p className="text-muted-foreground">لم يتم العثور على الجلسة</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
