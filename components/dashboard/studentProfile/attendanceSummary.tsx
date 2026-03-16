"use client";

import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  BookOpen,
} from "lucide-react";
import { SessionRecord } from "@/types/studentProfile";
import { SessionStatus, AttendanceStatus } from "@/types/session";

export function AttendanceSummary({ sessions }: { sessions: SessionRecord[] }) {
  const completed = sessions.filter(
    (s) => s.status === SessionStatus.COMPLETED,
  );
  const total = completed.length;
  const attended = completed.filter(
    (s) => s.attendance?.status === AttendanceStatus.ATTENDED,
  ).length;
  const late = completed.filter(
    (s) => s.attendance?.status === AttendanceStatus.LATE,
  ).length;
  const absentExcused = completed.filter(
    (s) => s.attendance?.status === AttendanceStatus.ABSENT_EXCUSED,
  ).length;
  const absentUnexcused = completed.filter(
    (s) => s.attendance?.status === AttendanceStatus.ABSENT_UNEXCUSED,
  ).length;
  const rate = total > 0 ? Math.round(((attended + late) / total) * 100) : 0;

  const stats = [
    {
      label: "إجمالي الحصص",
      value: sessions.length,
      icon: BookOpen,
      color: "text-foreground",
    },
    {
      label: "حاضر",
      value: attended,
      icon: CheckCircle2,
      color: "text-primary",
    },
    { label: "متأخر", value: late, icon: Clock, color: "text-orange-500" },
    {
      label: "غائب (بعذر)",
      value: absentExcused,
      icon: AlertTriangle,
      color: "text-amber-500",
    },
    {
      label: "غائب (بدون عذر)",
      value: absentUnexcused,
      icon: XCircle,
      color: "text-destructive",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="text-3xl font-bold text-primary">{rate}%</div>
        <div className="flex-1">
          <p className="text-sm text-muted-foreground mb-1">نسبة الحضور</p>
          <Progress value={rate} className="h-2" />
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className="flex flex-col items-center p-3 rounded-lg bg-muted/50"
          >
            <s.icon className={`h-5 w-5 mb-1 ${s.color}`} />
            <span className="text-lg font-bold">{s.value}</span>
            <span className="text-xs text-muted-foreground text-center">
              {s.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
