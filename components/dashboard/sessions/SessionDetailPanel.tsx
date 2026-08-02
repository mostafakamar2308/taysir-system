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
import { ExternalLink } from "lucide-react";
import { formatDate, formatTime } from "@/lib/dates";
import type { AdminSession } from "@/types/session";
import { AttendanceStatus, SessionStatus } from "@/types/session";

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
  const isCompleted = session.status === SessionStatus.COMPLETED;
  const isScheduled = session.status === SessionStatus.SCHEDULED;

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
            <TabsTrigger value="attendance">الحضور والتقارير</TabsTrigger>
            {session.assignment && (
              <TabsTrigger value="assignment">الواجب</TabsTrigger>
            )}
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

          {/* Assignment Tab */}
          {session.assignment && (
            <TabsContent value="assignment" className="space-y-4 mt-4">
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
                            {sol?.score !== null && sol?.score !== undefined ? (
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
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
