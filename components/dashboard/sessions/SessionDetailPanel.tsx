// components/dashboard/sessions/SessionDetailPanel.tsx
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Copy, ExternalLink, Video } from "lucide-react";
import { formatDate, formatTime } from "@/lib/dates";
import type { AdminSession } from "@/types/session";
import { AttendanceStatus, SessionStatus } from "@/types/session";
import { updateSession } from "@/actions/sessions";
import { ReportContent } from "@/components/dashboard/sessions/reportContent";

interface Props {
  session: AdminSession;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const sessionStatusLabels: Record<number, string> = {
  [SessionStatus.SCHEDULED]: "مجدولة",
  [SessionStatus.COMPLETED]: "مكتملة",
  [SessionStatus.CANCELLED]: "ملغاة",
};

const sessionStatusColors: Record<number, string> = {
  [SessionStatus.SCHEDULED]: "bg-blue-100 text-blue-700",
  [SessionStatus.COMPLETED]: "bg-green-100 text-green-700",
  [SessionStatus.CANCELLED]: "bg-red-100 text-red-700",
};

const attendanceLabels: Record<number, string> = {
  [AttendanceStatus.ATTENDED]: "حاضر",
  [AttendanceStatus.LATE]: "متأخر",
  [AttendanceStatus.ABSENT_EXCUSED]: "غائب بعذر",
  [AttendanceStatus.ABSENT_UNEXCUSED]: "غائب بدون عذر",
};

const attendanceColors: Record<number, string> = {
  [AttendanceStatus.ATTENDED]: "bg-green-100 text-green-700",
  [AttendanceStatus.LATE]: "bg-orange-100 text-orange-700",
  [AttendanceStatus.ABSENT_EXCUSED]: "bg-yellow-100 text-yellow-700",
  [AttendanceStatus.ABSENT_UNEXCUSED]: "bg-red-100 text-red-700",
};

export function SessionDetailPanel({ session, open, onOpenChange }: Props) {
  const { toast } = useToast();
  const isCompleted = session.status === SessionStatus.COMPLETED;
  const isScheduled = session.status === SessionStatus.SCHEDULED;
  const reportParticipants = session.participants.filter((p) => p.report);

  const [zoomEditMode, setZoomEditMode] = useState(false);
  const [zoomUrlInput, setZoomUrlInput] = useState(session.zoomUrl || "");
  const [displayZoomUrl, setDisplayZoomUrl] = useState(session.zoomUrl || "");
  const [savingZoom, setSavingZoom] = useState(false);

  const [recordingEditMode, setRecordingEditMode] = useState(false);
  const [recordingUrlInput, setRecordingUrlInput] = useState(
    session.recordingLink || "",
  );
  const [displayRecordingUrl, setDisplayRecordingUrl] = useState(
    session.recordingLink || "",
  );
  const [savingRecording, setSavingRecording] = useState(false);

  const handleSaveZoomUrl = async () => {
    const value = zoomUrlInput.trim();
    if (value && !value.startsWith("https://")) {
      toast({ title: "رابط غير صحيح", variant: "destructive" });
      return;
    }
    setSavingZoom(true);
    try {
      const res = await updateSession({ id: session.id, zoomUrl: value || null });
      if (!res.ok) throw new Error(res.error);
      setDisplayZoomUrl(value);
      setZoomEditMode(false);
      toast({ title: "تم حفظ الرابط" });
    } catch (error) {
      toast({
        title: error instanceof Error ? error.message : "حدث خطأ أثناء الحفظ",
        variant: "destructive",
      });
    } finally {
      setSavingZoom(false);
    }
  };

  const handleSaveRecordingUrl = async () => {
    const value = recordingUrlInput.trim();
    if (value && !value.startsWith("https://")) {
      toast({ title: "رابط غير صحيح", variant: "destructive" });
      return;
    }
    setSavingRecording(true);
    try {
      const res = await updateSession({
        id: session.id,
        recordingLink: value || null,
      });
      if (!res.ok) throw new Error(res.error);
      setDisplayRecordingUrl(value);
      setRecordingEditMode(false);
      toast({ title: "تم حفظ رابط التسجيل" });
    } catch (error) {
      toast({
        title: error instanceof Error ? error.message : "حدث خطأ أثناء الحفظ",
        variant: "destructive",
      });
    } finally {
      setSavingRecording(false);
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

        <Tabs defaultValue="overview">
          <TabsList className="w-full flex *:grow">
            <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
            <TabsTrigger value="attendance">الحضور</TabsTrigger>
            <TabsTrigger value="report">التقرير</TabsTrigger>
            <TabsTrigger value="zoom">الرابط</TabsTrigger>
            <TabsTrigger value="recording">التسجيل</TabsTrigger>
            <TabsTrigger value="assignment">الواجب</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 mt-4">
            <div className="flex items-center gap-2">
              <Badge className={sessionStatusColors[session.status]}>
                {sessionStatusLabels[session.status]}
              </Badge>
              {session.isTrial && (
                <Badge
                  variant="outline"
                  className="border-amber-300 text-amber-700"
                >
                  تجريبية
                </Badge>
              )}
            </div>
            <div className="space-y-2">
              <div>
                <span className="text-muted-foreground text-sm">الوقت: </span>
                <span>
                  {formatDate(session.startTime)} •{" "}
                  {formatTime(session.startTime)} –{" "}
                  {formatTime(session.endTime)}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground text-sm">المعلم: </span>
                <span>{session.tutorName}</span>
              </div>
              <div>
                <span className="text-muted-foreground text-sm">
                  المجموعة:{" "}
                </span>
                <span>{session.groupName}</span>
              </div>
              <div>
                <span className="text-muted-foreground text-sm">الطلاب: </span>
                <span>
                  {session.participants.map((p) => p.name).join("، ")}
                </span>
              </div>
              {session.topic && (
                <div>
                  <span className="text-muted-foreground text-sm">
                    الموضوع:{" "}
                  </span>
                  <span>{session.topic}</span>
                </div>
              )}
              {!isCompleted && session.zoomUrl && (
                <div className="pt-2">
                  <Button variant="outline" size="sm" asChild>
                    <a href={session.zoomUrl} target="_blank" rel="noreferrer">
                      <ExternalLink className="h-4 w-4 ml-1" /> رابط الحصة
                    </a>
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Attendance & Reports Tab */}
          <TabsContent value="attendance" className="space-y-4 mt-4">
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-2 text-right">الطالب</th>
                    <th className="p-2 text-right">الحضور</th>
                    <th className="p-2 text-right">التقرير</th>
                  </tr>
                </thead>
                <tbody>
                  {session.participants.map((p) => (
                    <tr
                      key={p.id}
                      className="border-t border-border hover:bg-muted/50"
                    >
                      <td className="p-2">{p.name}</td>
                      <td className="p-2">
                        {isCompleted ? (
                          p.status !== null ? (
                            <Badge className={attendanceColors[p.status]}>
                              {attendanceLabels[p.status] ?? "غير معروف"}
                            </Badge>
                          ) : (
                            <span className="text-amber-600 text-xs">
                              غير مسجل
                            </span>
                          )
                        ) : isScheduled ? (
                          <span className="text-muted-foreground text-xs">
                            مجدولة
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">
                            —
                          </span>
                        )}
                      </td>
                      <td className="p-2">
                        {isCompleted ? (
                          p.report ? (
                            <Badge
                              variant="outline"
                              className="bg-primary/10 text-primary"
                            >
                              مكتمل
                            </Badge>
                          ) : p.status !== null &&
                            [
                              AttendanceStatus.ATTENDED,
                              AttendanceStatus.LATE,
                            ].includes(p.status) ? (
                            <span className="text-red-600 text-xs">
                              غير مكتوب
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-xs">
                              —
                            </span>
                          )
                        ) : (
                          <span className="text-muted-foreground text-xs">
                            —
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* Report Tab */}
          <TabsContent value="report" className="space-y-4 mt-4">
            {reportParticipants.length === 0 ? (
              <p className="text-center text-muted-foreground py-6 text-sm">
                لا توجد تقارير لهذه الحصة
              </p>
            ) : (
              <div className="space-y-4">
                {reportParticipants.map((p) => (
                  <div key={p.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-sm">
                        {p.name}
                        <span className="text-xs text-muted-foreground font-normal mr-2">
                          تقرير المعلم
                        </span>
                      </p>
                      {p.report!.rating != null && (
                        <Badge
                          variant="outline"
                          className="bg-primary/10 text-primary"
                        >
                          {p.report!.rating} / 5
                        </Badge>
                      )}
                    </div>
                    <ReportContent report={p.report!} />
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Assignment Tab (read-only view) */}
          <TabsContent value="assignment" className="space-y-4 mt-4">
            {!session.assignment ? (
              <p className="text-center text-muted-foreground py-6 text-sm">
                لا يوجد واجب لهذه الحصة
              </p>
            ) : (
              <>
                <div className="space-y-2 border rounded-lg p-4">
                  <h3 className="font-semibold">
                    {session.assignment.title || "بدون عنوان"}
                  </h3>
                  {session.assignment.description && (
                    <p className="text-sm text-muted-foreground">
                      {session.assignment.description}
                    </p>
                  )}
                  <div className="flex gap-4 text-sm">
                    <span>الدرجة القصوى: {session.assignment.maxScore}</span>
                    {session.assignment.deadline && (
                      <span>
                        آخر موعد: {formatDate(session.assignment.deadline)}
                      </span>
                    )}
                  </div>
                  {session.assignment.fileUrl && (
                    <a
                      href={session.assignment.fileUrl}
                      download
                      className="text-primary underline text-sm"
                    >
                      تحميل ملف الواجب
                    </a>
                  )}
                </div>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="p-2 text-right">الطالب</th>
                        <th className="p-2 text-right">الحل</th>
                        <th className="p-2 text-right">النتيجة</th>
                        <th className="p-2 text-right">ملاحظات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {session.participants.map((p) => {
                        const sol = p.homeworkSolution;
                        return (
                          <tr
                            key={p.id}
                            className="border-t border-border hover:bg-muted/50"
                          >
                            <td className="p-2">{p.name}</td>
                            <td className="p-2">
                              {sol ? (
                                <a
                                  href={sol.fileUrl}
                                  download
                                  className="text-primary underline text-xs"
                                >
                                  تحميل
                                </a>
                              ) : (
                                <span className="text-muted-foreground text-xs">
                                  لم يرفع
                                </span>
                              )}
                            </td>
                            <td className="p-2">
                              {sol?.score !== null &&
                              sol?.score !== undefined ? (
                                <span>
                                  {sol.score}/{session.assignment?.maxScore}
                                </span>
                              ) : sol ? (
                                <span className="text-amber-600 text-xs">
                                  غير مصحح
                                </span>
                              ) : (
                                "—"
                              )}
                            </td>
                            <td className="p-2 text-xs">
                              {sol?.feedback ?? "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </TabsContent>

          {/* Zoom Tab */}
          <TabsContent value="zoom" className="space-y-4 mt-4">
            <div className="flex items-center gap-2 text-primary">
              <Video className="h-5 w-5" />
              <span className="font-semibold">رابط زووم</span>
            </div>

            {zoomEditMode ? (
              <div className="space-y-4 border rounded-lg p-4">
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">
                    رابط الحصة
                  </Label>
                  <Input
                    value={zoomUrlInput}
                    onChange={(e) => setZoomUrlInput(e.target.value)}
                    placeholder="https://zoom.us/j/..."
                    dir="ltr"
                  />
                  <p className="text-xs text-muted-foreground">
                    الرابط يبدأ بـ https:// ويُتاح للطلاب والمعلم.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSaveZoomUrl} disabled={savingZoom}>
                    حفظ
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setZoomEditMode(false);
                      setZoomUrlInput(displayZoomUrl);
                    }}
                  >
                    إلغاء
                  </Button>
                </div>
              </div>
            ) : displayZoomUrl ? (
              <>
                <div className="flex items-center gap-2">
                  <Input
                    value={displayZoomUrl}
                    readOnly
                    className="font-mono text-sm"
                    dir="ltr"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    title="نسخ الرابط"
                    onClick={() => {
                      navigator.clipboard.writeText(displayZoomUrl);
                      toast({ title: "تم النسخ" });
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    title="فتح الرابط"
                    onClick={() => window.open(displayZoomUrl, "_blank")}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setZoomEditMode(true)}>
                  تعديل
                </Button>
              </>
            ) : (
              <div className="space-y-4 border rounded-lg p-4">
                <p className="text-sm text-muted-foreground">
                  لا يوجد رابط زووم لهذه الحصة. يمكنك إضافة رابط الاجتماع من هنا.
                </p>
                <Button onClick={() => setZoomEditMode(true)}>إضافة الرابط</Button>
              </div>
            )}
          </TabsContent>

          {/* Recording Tab */}
          <TabsContent value="recording" className="space-y-4 mt-4">
            <div className="flex items-center gap-2 text-primary">
              <Video className="h-5 w-5" />
              <span className="font-semibold">رابط تسجيل الحصة</span>
            </div>

            {!isCompleted ? (
              <div className="border rounded-lg p-4">
                <p className="text-sm text-muted-foreground">
                  لا يمكن إضافة رابط التسجيل إلا بعد انتهاء الحصة.
                </p>
              </div>
            ) : recordingEditMode ? (
              <div className="space-y-4 border rounded-lg p-4">
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">
                    رابط التسجيل
                  </Label>
                  <Input
                    value={recordingUrlInput}
                    onChange={(e) => setRecordingUrlInput(e.target.value)}
                    placeholder="https://..."
                    dir="ltr"
                  />
                  <p className="text-xs text-muted-foreground">
                    الرابط يبدأ بـ https:// ويُتاح للطلاب للمشاهدة.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleSaveRecordingUrl}
                    disabled={savingRecording}
                  >
                    حفظ
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setRecordingEditMode(false);
                      setRecordingUrlInput(displayRecordingUrl);
                    }}
                  >
                    إلغاء
                  </Button>
                </div>
              </div>
            ) : displayRecordingUrl ? (
              <>
                <div className="flex items-center gap-2">
                  <Input
                    value={displayRecordingUrl}
                    readOnly
                    className="font-mono text-sm"
                    dir="ltr"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    title="نسخ الرابط"
                    onClick={() => {
                      navigator.clipboard.writeText(displayRecordingUrl);
                      toast({ title: "تم النسخ" });
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    title="فتح الرابط"
                    onClick={() => window.open(displayRecordingUrl, "_blank")}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setRecordingEditMode(true)}
                >
                  تعديل
                </Button>
              </>
            ) : (
              <div className="space-y-4 border rounded-lg p-4">
                <p className="text-sm text-muted-foreground">
                  لا يوجد رابط تسجيل لهذه الحصة. يمكنك إضافة رابط تسجيل الحصة من
                  هنا.
                </p>
                <Button onClick={() => setRecordingEditMode(true)}>
                  إضافة رابط التسجيل
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
