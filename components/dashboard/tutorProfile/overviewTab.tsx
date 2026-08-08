"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, CheckCircle2, ClipboardList } from "lucide-react";
import type { TutorProfile } from "@/types/tutor";
import dayjs from "@/lib/dayjs";
import ScoreCard from "./scoreCard"; // we'll replace this component

interface Props {
  tutor: TutorProfile;
}

export default function OverviewTab({ tutor }: Props) {
  const todayStr = dayjs().format("YYYY-MM-DD");

  const groupsWithTodaySessions = tutor.groups.filter(
    (g) =>
      g.nextSessionDate &&
      dayjs(g.nextSessionDate).format("YYYY-MM-DD") === todayStr,
  );

  const summaryCards = [
    {
      label: "المجموعات",
      value: tutor.groups.length,
      icon: Users,
      color: "text-primary",
    },
    {
      label: "حصص هذا الشهر",
      value: tutor.monthlyStats.totalSessions,
      icon: Calendar,
      color: "text-blue-500",
    },
    {
      label: "نسبة الحضور",
      value: `${tutor.performanceMetrics.attendanceRate.toFixed(1)}%`,
      icon: CheckCircle2,
      color: "text-primary",
    },
    {
      label: "الواجبات المصححة",
      value: tutor.performanceMetrics.homeworkGradingCount,
      icon: ClipboardList,
      color: "text-green-500",
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

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">حصص اليوم</CardTitle>
        </CardHeader>
        <CardContent>
          {groupsWithTodaySessions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              لا توجد حصص اليوم
            </p>
          ) : (
            <div className="space-y-2">
              {groupsWithTodaySessions.map((g) => (
                <div
                  key={g.id}
                  className="flex items-center justify-between p-2 border rounded"
                >
                  <span className="font-medium">{g.title}</span>
                  <span className="text-sm text-muted-foreground">
                    {dayjs(g.nextSessionDate).format("HH:mm")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
