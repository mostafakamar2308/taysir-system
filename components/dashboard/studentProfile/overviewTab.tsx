"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import { StudentProfile } from "@/types/studentProfile";
import { AttendanceSummary } from "@/components/dashboard/studentProfile/attendanceSummary";
import { getStudentWarnings } from "@/lib/studentWarning";

interface OverviewTabProps {
  student: StudentProfile;
  onMarkPayment?: () => void;
  onContact?: () => void;
  onViewAttendance?: () => void;
  onAddNote?: () => void;
}

export default function OverviewTab({
  student,
  onMarkPayment,
  onContact,
  onViewAttendance,
}: OverviewTabProps) {
  const warnings = getStudentWarnings(student, onMarkPayment, onContact);

  const upcomingSessions = student.sessions
    .filter((s) => new Date(s.startTime) > new Date() && s.status === 0)
    .sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
    )
    .slice(0, 3);

  const recentSessions = student.sessions
    .filter((s) => new Date(s.startTime) <= new Date())
    .sort(
      (a, b) =>
        new Date(b.startTime).getTime() - new Date(a.startTime).getTime(),
    )
    .slice(0, 3);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  const formatTime = (d: string) =>
    new Date(d).toLocaleTimeString("ar-EG", {
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="space-y-6">
      {/* Warnings Section */}
      {warnings.length > 0 && (
        <div className="space-y-2">
          {warnings.map((w, i) => (
            <div
              key={i}
              className={`flex items-center justify-between p-4 rounded-lg border ${
                w.type === "danger"
                  ? "bg-destructive/10 border-destructive/30"
                  : w.type === "warning"
                    ? "bg-amber-50 border-amber-200"
                    : "bg-blue-50 border-blue-200"
              }`}
            >
              <div className="flex items-center gap-3">
                <AlertTriangle
                  className={`h-5 w-5 ${
                    w.type === "danger"
                      ? "text-destructive"
                      : w.type === "warning"
                        ? "text-amber-600"
                        : "text-blue-600"
                  }`}
                />
                <span className="text-sm font-medium">{w.message}</span>
              </div>
              {w.action && (
                <Button size="sm" variant="outline" onClick={w.action.onClick}>
                  {w.action.label}
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Attendance Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">ملخص الحضور</CardTitle>
        </CardHeader>
        <CardContent>
          <AttendanceSummary sessions={student.sessions} />
        </CardContent>
      </Card>

      {/* Upcoming and Recent Sessions */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">الحصص القادمة</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingSessions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                لا توجد حصص قادمة
              </p>
            ) : (
              <div className="space-y-3">
                {upcomingSessions.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card"
                  >
                    <div>
                      <p className="font-medium text-sm">
                        {s.topic || "بدون موضوع"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(s.startTime)} • {formatTime(s.startTime)} -{" "}
                        {formatTime(s.endTime)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        مع {s.tutorName}
                      </p>
                    </div>
                    <Badge className="bg-blue-100 text-blue-700">مجدولة</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">آخر الحصص</CardTitle>
          </CardHeader>
          <CardContent>
            {recentSessions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                لا توجد حصص سابقة
              </p>
            ) : (
              <div className="space-y-3">
                {recentSessions.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card"
                  >
                    <div>
                      <p className="font-medium text-sm">
                        {s.topic || "بدون موضوع"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(s.startTime)} • {formatTime(s.startTime)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Badge className="bg-green-100 text-green-700">
                        مكتملة
                      </Badge>
                      {s.attendance && (
                        <Badge
                          className={
                            s.attendance.status === 0
                              ? "bg-green-100 text-green-700"
                              : s.attendance.status === 3
                                ? "bg-orange-100 text-orange-700"
                                : s.attendance.status === 1
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-red-100 text-red-700"
                          }
                        >
                          {s.attendance.status === 0
                            ? "حاضر"
                            : s.attendance.status === 3
                              ? "متأخر"
                              : s.attendance.status === 1
                                ? "غائب (بعذر)"
                                : "غائب (بدون عذر)"}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Latest Note */}
      {student.notes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">آخر ملاحظة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 rounded-lg bg-muted/50 border">
              <p className="text-sm">{student.notes[0].content}</p>
              <p className="text-xs text-muted-foreground mt-2">
                {student.notes[0].authorName} •{" "}
                {formatDate(student.notes[0].createdAt)}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
