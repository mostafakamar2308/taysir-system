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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { updateSession } from "@/actions/sessions";
import { markStudentAttendanceByTutor } from "@/actions/tutor/attendance";
import { upsertSessionReport } from "@/actions/tutor/report";
import { formatDate, formatTime } from "@/lib/dates";
import { sessionStatusLabels, sessionStatusColors } from "@/const/sessions";
import {
  AttendanceStatus,
  DashboardSession,
  SessionStatus,
} from "@/types/session";
import { Copy, ExternalLink, Video } from "lucide-react";
import dayjs from "@/lib/dayjs";

interface SessionDetailPanelProps {
  session: DashboardSession;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

export default function SessionDetailPanel({
  session,
  open,
  onOpenChange,
  onUpdate,
}: SessionDetailPanelProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("zoom");
  const [editMode, setEditMode] = useState(false);

  // edit fields – only used when !isPast
  const [editDate, setEditDate] = useState(
    dayjs(session.startTime).format("YYYY-MM-DD"),
  );
  const [editStartTime, setEditStartTime] = useState(
    dayjs(session.startTime).format("HH:mm"),
  );
  const [editDuration, setEditDuration] = useState(session.durationMinutes);
  const [topic, setTopic] = useState(session.topic || "");
  const [notes, setNotes] = useState(session.notes || "");

  const [attendanceStatus, setAttendanceStatus] = useState<string>(
    session.attendance?.tutorAttendance?.toString() || "",
  );
  const [attendanceReason, setAttendanceReason] = useState(
    session.attendance?.reason || "",
  );
  const [reportData, setReportData] = useState({
    rating: session.report?.rating?.toString() || "",
    outcomes: session.report?.outcomes || "",
    strengths: session.report?.strengths || "",
    weaknesses: session.report?.weaknesses || "",
    nextGoals: session.report?.nextGoals || "",
    comments: session.report?.comments || "",
  });

  const isPast = new Date(session.startTime) < new Date();
  const canMarkAttendance =
    isPast && session.status === SessionStatus.COMPLETED && !session.attendance;

  const handleEnterEditMode = () => {
    if (!isPast) {
      setEditDate(dayjs(session.startTime).format("YYYY-MM-DD"));
      setEditStartTime(dayjs(session.startTime).format("HH:mm"));
      setEditDuration(session.durationMinutes);
    }
    setTopic(session.topic || "");
    setNotes(session.notes || "");
    setEditMode(true);
  };

  const handleUpdateFullDetails = async () => {
    setLoading(true);
    try {
      const payload: {
        id: number;
        date?: string;
        startTime?: string;
        duration?: number;
        topic?: string;
      } = {
        id: session.id,
        topic: topic,
      };

      if (!isPast) {
        const startTimeISO = dayjs(
          `${editDate}T${editStartTime}:00`,
        ).toISOString();
        payload.date = editDate;
        payload.startTime = startTimeISO;
        payload.duration = editDuration;
      }

      await updateSession(payload);
      toast({ title: "تم تحديث الحصة" });
      setEditMode(false);
      onUpdate();
      router.refresh();
    } catch (error) {
      if (error instanceof Error)
        toast({ title: error.message, variant: "destructive" });
      else toast({ title: "حدث خطأ", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAttendance = async () => {
    if (!attendanceStatus) {
      toast({ title: "يرجى اختيار حالة الحضور", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await markStudentAttendanceByTutor(
        session.id,
        parseInt(attendanceStatus) as AttendanceStatus,
        attendanceReason || undefined,
      );
      toast({ title: "تم تسجيل الحضور" });
      onUpdate?.();
      router.refresh();
    } catch (error) {
      if (error instanceof Error)
        toast({
          title: "خطأ",
          description: error.message,
          variant: "destructive",
        });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReport = async () => {
    if (
      !reportData.outcomes &&
      !reportData.strengths &&
      !reportData.weaknesses &&
      !reportData.nextGoals
    ) {
      toast({
        title: "يرجى ملء الحقول الأساسية للتقرير",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      await upsertSessionReport(session.id, {
        rating: reportData.rating ? parseInt(reportData.rating) : undefined,
        outcomes: reportData.outcomes || null,
        strengths: reportData.strengths || null,
        weaknesses: reportData.weaknesses || null,
        nextGoals: reportData.nextGoals || null,
        comments: reportData.comments || null,
      });
      toast({ title: "تم حفظ التقرير" });
      onUpdate?.();
      router.refresh();
    } catch (error) {
      if (error instanceof Error)
        toast({
          title: "خطأ",
          description: error.message,
          variant: "destructive",
        });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-2xl max-h-[90vh] overflow-y-auto"
        dir="rtl"
      >
        <DialogHeader>
          <DialogTitle>تفاصيل الحصة</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex w-full *:grow">
            {session.zoomJoinUrl && (
              <TabsTrigger value="zoom">الرابط</TabsTrigger>
            )}
            <TabsTrigger value="details">التفاصيل</TabsTrigger>
            <TabsTrigger value="attendance">الحضور</TabsTrigger>
            {session.attendance &&
            [AttendanceStatus.ATTENDED, AttendanceStatus.LATE].includes(
              session.attendance.studentAttendance,
            ) ? (
              <TabsTrigger value="report">التقرير</TabsTrigger>
            ) : null}
          </TabsList>

          {/* Zoom Links Tab */}
          <TabsContent value="zoom" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <Video className="h-5 w-5" />
                <span className="font-semibold">رابط زووم</span>
              </div>

              {/* Join URL */}
              <div className="space-y-1">
                <Label className="text-sm text-muted-foreground">
                  رابط الحضور للطالب
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
                    title="نسخ الرابط"
                    onClick={() => {
                      navigator.clipboard.writeText(session.zoomJoinUrl || "");
                      toast({ title: "تم نسخ الرابط" });
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    title="فتح الرابط"
                    onClick={() => window.open(session.zoomJoinUrl!, "_blank")}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Start URL (for tutor) */}
              {session.zoomStartUrl && (
                <div className="space-y-1">
                  <Label className="text-sm text-muted-foreground">
                    رابط البدء للمعلم
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
                      title="نسخ الرابط"
                      onClick={() => {
                        navigator.clipboard.writeText(
                          session.zoomStartUrl || "",
                        );
                        toast({ title: "تم نسخ الرابط" });
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      title="فتح الرابط"
                      onClick={() =>
                        window.open(session.zoomStartUrl!, "_blank")
                      }
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                رابط الحضور يشارك مع الطالب، رابط البدء خاص بك (المعلم).
              </p>
            </div>
          </TabsContent>

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
                    onClick={handleEnterEditMode}
                  >
                    تعديل
                  </Button>
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">الطالب</p>
                <p className="font-medium">{session.studentName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">التاريخ والوقت</p>
                <p dir="rtl">
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
                        <Label>وقت البدء</Label>
                        <Input
                          type="time"
                          value={editStartTime}
                          onChange={(e) => setEditStartTime(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>المدة (دقيقة)</Label>
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
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
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
                    <div>
                      <p className="text-sm text-muted-foreground">الموضوع</p>
                      <p>{session.topic}</p>
                    </div>
                  )}
                  {session.notes && (
                    <div>
                      <p className="text-sm text-muted-foreground">ملاحظات</p>
                      <p>{session.notes}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </TabsContent>

          {/* Attendance Tab */}
          <TabsContent value="attendance" className="space-y-4 mt-4">
            {canMarkAttendance ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>حالة الحضور</Label>
                  <Select
                    value={attendanceStatus}
                    onValueChange={setAttendanceStatus}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الحالة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={AttendanceStatus.ATTENDED.toString()}>
                        حاضر
                      </SelectItem>
                      <SelectItem value={AttendanceStatus.LATE.toString()}>
                        متأخر
                      </SelectItem>
                      <SelectItem
                        value={AttendanceStatus.ABSENT_EXCUSED.toString()}
                      >
                        غائب بعذر
                      </SelectItem>
                      <SelectItem
                        value={AttendanceStatus.ABSENT_UNEXCUSED.toString()}
                      >
                        غائب بدون عذر
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>السبب (للغياب)</Label>
                  <Textarea
                    value={attendanceReason}
                    onChange={(e) => setAttendanceReason(e.target.value)}
                    rows={2}
                    placeholder="اكتب سبب الغياب إن وجد"
                  />
                </div>
                <Button onClick={handleMarkAttendance} disabled={loading}>
                  تسجيل الحضور
                </Button>
              </div>
            ) : session.attendance ? (
              <div>
                <p className="text-sm text-muted-foreground">تم تسجيل الحضور</p>
                <Badge
                  className={
                    session.attendance.tutorAttendance ===
                    AttendanceStatus.ATTENDED
                      ? "bg-green-100 text-green-700"
                      : session.attendance.tutorAttendance ===
                          AttendanceStatus.LATE
                        ? "bg-orange-100 text-orange-700"
                        : "bg-red-100 text-red-700"
                  }
                >
                  {session.attendance.tutorAttendance ===
                  AttendanceStatus.ATTENDED
                    ? "حاضر"
                    : session.attendance.tutorAttendance ===
                        AttendanceStatus.LATE
                      ? "متأخر"
                      : "غائب"}
                </Badge>
                {session.attendance.reason && (
                  <p className="mt-2 text-sm">
                    السبب: {session.attendance.reason}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">
                لا يمكن تسجيل الحضور إلا بعد انتهاء الحصة
              </p>
            )}
          </TabsContent>

          {/* Report Tab */}
          <TabsContent value="report" className="space-y-4 mt-4">
            {session.report ? (
              <div className="space-y-3">
                {session.report.rating && (
                  <div>
                    <p className="text-sm text-muted-foreground">التقييم</p>
                    <p>{session.report.rating} / 5</p>
                  </div>
                )}
                {session.report.outcomes && (
                  <div>
                    <p className="text-sm text-muted-foreground">النتائج</p>
                    <p>{session.report.outcomes}</p>
                  </div>
                )}
                {session.report.strengths && (
                  <div>
                    <p className="text-sm text-muted-foreground">نقاط القوة</p>
                    <p>{session.report.strengths}</p>
                  </div>
                )}
                {session.report.weaknesses && (
                  <div>
                    <p className="text-sm text-muted-foreground">نقاط الضعف</p>
                    <p>{session.report.weaknesses}</p>
                  </div>
                )}
                {session.report.nextGoals && (
                  <div>
                    <p className="text-sm text-muted-foreground">
                      الأهداف القادمة
                    </p>
                    <p>{session.report.nextGoals}</p>
                  </div>
                )}
                {session.report.comments && (
                  <div>
                    <p className="text-sm text-muted-foreground">تعليقات</p>
                    <p>{session.report.comments}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>التقييم (1-5)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="5"
                    value={reportData.rating}
                    onChange={(e) =>
                      setReportData({ ...reportData, rating: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>النتائج (ما تم إنجازه) *</Label>
                  <Textarea
                    value={reportData.outcomes}
                    onChange={(e) =>
                      setReportData({
                        ...reportData,
                        outcomes: e.target.value,
                      })
                    }
                    rows={2}
                    placeholder="اذكر ما تم تحقيقه في هذه الحصة"
                  />
                </div>
                <div className="space-y-2">
                  <Label>نقاط القوة</Label>
                  <Textarea
                    value={reportData.strengths}
                    onChange={(e) =>
                      setReportData({
                        ...reportData,
                        strengths: e.target.value,
                      })
                    }
                    rows={2}
                    placeholder="ما الذي أجاد فيه الطالب؟"
                  />
                </div>
                <div className="space-y-2">
                  <Label>نقاط الضعف</Label>
                  <Textarea
                    value={reportData.weaknesses}
                    onChange={(e) =>
                      setReportData({
                        ...reportData,
                        weaknesses: e.target.value,
                      })
                    }
                    rows={2}
                    placeholder="ما الذي يحتاج إلى تحسين؟"
                  />
                </div>
                <div className="space-y-2">
                  <Label>الأهداف القادمة *</Label>
                  <Textarea
                    value={reportData.nextGoals}
                    onChange={(e) =>
                      setReportData({
                        ...reportData,
                        nextGoals: e.target.value,
                      })
                    }
                    rows={2}
                    placeholder="ما هي أهداف الحصة القادمة؟"
                  />
                </div>
                <div className="space-y-2">
                  <Label>تعليقات إضافية</Label>
                  <Textarea
                    value={reportData.comments}
                    onChange={(e) =>
                      setReportData({
                        ...reportData,
                        comments: e.target.value,
                      })
                    }
                    rows={2}
                    placeholder="أي ملاحظات أخرى"
                  />
                </div>
                <Button onClick={handleSubmitReport} disabled={loading}>
                  حفظ التقرير
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إغلاق
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
