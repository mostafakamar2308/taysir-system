"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { updateSession } from "@/actions/sessions";
import { formatDate, formatTime } from "@/lib/dates";
import { sessionStatusLabels, sessionStatusColors } from "@/const/sessions";
import { AttendanceStatus, SessionStatus } from "@/types/session";
import { AdminSessionClientData } from "@/types/session";
import { UpdateSessionInput } from "@/actions/sessions";
import { Copy, ExternalLink, Video, Trash2 } from "lucide-react";
import dayjs from "@/lib/dayjs";

interface SessionDetailPanelProps {
  session: AdminSessionClientData;
  onClose: () => void;
  onDelete?: (session: AdminSessionClientData) => void;
}

export function SessionDetailPanel({
  session,
  onClose,
  onDelete,
}: SessionDetailPanelProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [editMode, setEditMode] = useState(false);

  const [editDate, setEditDate] = useState(
    dayjs(session.startTime).format("YYYY-MM-DD"),
  );
  const [editStartTime, setEditStartTime] = useState(
    dayjs(session.startTime).format("HH:mm"),
  );
  const [editDuration, setEditDuration] = useState(session.durationMinutes);
  const [topic, setTopic] = useState(session.topic || "");
  const [notes, setNotes] = useState(session.notes || "");

  const isPast = new Date(session.startTime) < new Date();
  const isCompleted = session.status === SessionStatus.COMPLETED;

  const attendanceBadge = (
    p: AdminSessionClientData["participants"][number],
  ) => {
    if (p.attendanceStatus === null) {
      return isCompleted ? (
        <Badge
          variant="outline"
          className="border-amber-300 text-amber-700 bg-amber-50"
        >
          غير مسجل
        </Badge>
      ) : (
        <span className="text-xs text-muted-foreground">—</span>
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

  const handleUpdateFullDetails = async () => {
    setLoading(true);
    try {
      const payload: UpdateSessionInput = { id: session.id, topic, notes };
      if (!isPast) {
        const startTimeISO = dayjs(
          `${editDate}T${editStartTime}:00`,
        ).toISOString();
        payload.date = editDate;
        payload.startTime = startTimeISO;
        payload.duration = editDuration;
      }
      await updateSession(payload);
      toast({ title: "تم التحديث" });
      setEditMode(false);
      router.refresh();
    } catch (error) {
      toast({
        title: "خطأ",
        description: error instanceof Error ? error.message : "",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-2xl max-h-[90vh] overflow-y-auto"
        dir="rtl"
      >
        <DialogHeader>
          <DialogTitle>تفاصيل الحصة</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex w-full *:grow">
            <TabsTrigger value="details">التفاصيل</TabsTrigger>
            <TabsTrigger value="participants">الطلاب</TabsTrigger>
            {session.zoomJoinUrl && (
              <TabsTrigger value="zoom">زووم</TabsTrigger>
            )}
          </TabsList>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-4 mt-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Badge
                  className={
                    sessionStatusColors[session.status as SessionStatus]
                  }
                >
                  {sessionStatusLabels[session.status as SessionStatus]}
                </Badge>
                {!editMode && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditMode(true)}
                  >
                    تعديل
                  </Button>
                )}
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
              {editMode ? (
                <>
                  {!isPast && (
                    <>
                      <div className="space-y-2">
                        <Label>التاريخ</Label>
                        <Input
                          type="date"
                          value={editDate}
                          onChange={(e) => setEditDate(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>وقت البداية</Label>
                        <Input
                          type="time"
                          value={editStartTime}
                          onChange={(e) => setEditStartTime(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>المدة (دقائق)</Label>
                        <Input
                          type="number"
                          value={editDuration}
                          onChange={(e) =>
                            setEditDuration(parseInt(e.target.value))
                          }
                        />
                      </div>
                    </>
                  )}
                  <div className="space-y-2">
                    <Label>الموضوع</Label>
                    <Input
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>ملاحظات</Label>
                    <Input
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleUpdateFullDetails}
                      disabled={loading}
                    >
                      حفظ
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setEditMode(false)}
                    >
                      إلغاء
                    </Button>
                  </div>
                </>
              ) : (
                <>
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
                </>
              )}
            </div>
          </TabsContent>

          {/* Participants Tab – read only */}
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

          {/* Zoom Tab – read only */}
          {session.zoomJoinUrl && (
            <TabsContent value="zoom" className="space-y-4 mt-4">
              <div className="space-y-4">
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
              </div>
            </TabsContent>
          )}
        </Tabs>

        <DialogFooter className="flex gap-2 justify-between">
          {onDelete ? (
            <Button
              variant="outline"
              onClick={() => onDelete(session)}
              className="gap-2 text-destructive"
            >
              <Trash2 className="h-4 w-4" /> حذف
            </Button>
          ) : null}
          <Button variant="outline" onClick={onClose}>
            إغلاق
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
