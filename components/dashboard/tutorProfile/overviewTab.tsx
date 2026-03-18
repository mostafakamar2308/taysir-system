"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Calendar, CheckCircle2, BookOpen } from "lucide-react";
import type { TutorProfile } from "@/types/tutor";
import { sessionStatusColors, sessionStatusLabels } from "@/const/sessions";
import dayjs from "@/lib/dayjs";
import ScoreCard from "./scoreCard";

interface OverviewTabProps {
  tutor: TutorProfile;
}

export default function OverviewTab({ tutor }: OverviewTabProps) {
  const todaySessions = tutor.sessions.filter((s) => {
    const d = new Date(s.startTime);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  });

  const upcomingThisWeek = tutor.sessions.filter((s) => {
    const startOfWeek = dayjs().startOf("week");
    const endOfWeek = dayjs().endOf("week");
    return (
      dayjs(s.startTime).isAfter(startOfWeek) &&
      dayjs(s.startTime).isBefore(endOfWeek)
    );
  });

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

  const summaryCards = [
    {
      label: "إجمالي الطلاب",
      value: tutor.students.length,
      icon: Users,
      color: "text-primary",
    },
    {
      label: "حصص هذا الأسبوع",
      value: upcomingThisWeek.length,
      icon: Calendar,
      color: "text-blue-500",
    },
    {
      label: "نسبة الحضور",
      value: `${tutor.monthlyStats.attendanceRate.toFixed(1)}%`,
      icon: CheckCircle2,
      color: "text-primary",
    },
    {
      label: "إجمالي الحصص",
      value: tutor.sessions.length,
      icon: BookOpen,
      color: "text-muted-foreground",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {summaryCards.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 flex flex-col items-center text-center">
              <s.icon className={`h-6 w-6 mb-2 ${s.color}`} />
              <span className="text-2xl font-bold">{s.value}</span>
              <span className="text-xs text-muted-foreground">{s.label}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      <ScoreCard performanceMetrics={tutor.performanceMetrics} />

      {/* Today's Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            حصص اليوم ({todaySessions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {todaySessions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              لا توجد حصص لهذا اليوم
            </p>
          ) : (
            <div className="space-y-3">
              {todaySessions.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div>
                    <p className="font-medium text-sm">{s.studentName}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatTime(s.startTime)} – {formatTime(s.endTime)} •{" "}
                      {s.topic || "بدون موضوع"}
                    </p>
                  </div>
                  <Badge className={sessionStatusColors[s.status]}>
                    {sessionStatusLabels[s.status]}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Latest Note */}
      {tutor.notes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">آخر ملاحظة من الإدارة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 rounded-lg bg-muted/50 border">
              <p className="text-sm">{tutor.notes[0].content}</p>
              <p className="text-xs text-muted-foreground mt-2">
                {tutor.notes[0].authorName} •{" "}
                {formatDate(tutor.notes[0].createdAt)}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
